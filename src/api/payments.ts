/**
 * Customer payment server functions — Stripe Checkout + Stripe Connect.
 *
 * Flow:
 *   createCheckoutSessionForOrder
 *     1. Validates cart items against the DB (server-side price recalculation)
 *     2. Creates an order with payment_status = 'pending'
 *     3. Creates a Stripe Checkout Session (destination charge → restaurant's account)
 *     4. Saves session id to order
 *     5. Returns { checkoutUrl }
 *
 *   retryCheckoutSessionForOrder
 *     Creates a fresh session for an existing pending/failed order.
 *
 *   getPaymentStatusForOrder
 *     Looks up order by stripe_checkout_session_id.
 *     If the DB still shows 'pending', cross-checks Stripe live to handle
 *     webhook-delay edge cases and updates DB if already paid.
 *
 * Security:
 *   - STRIPE_SECRET_KEY is server-only (no VITE_ prefix)
 *   - All prices recalculated from DB — client totals are ignored
 *   - No application_fee_amount (MVP — no FlipNosh commission)
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the origin of the current request so that Stripe's success_url /
 * cancel_url always point back to wherever the customer actually came from.
 *
 * Priority:
 *   1. Live request origin (getRequestHost + getRequestProtocol via TanStack
 *      Start server context) — works automatically on:
 *        • localhost:8080  (local dev)
 *        • *.netlify.app   (deploy previews)
 *        • flipnosh.com    (production)
 *        • any custom restaurant domain routed to the same app
 *   2. VITE_APP_URL env var  — explicit override / CI fallback
 *   3. URL env var           — Netlify auto-inject
 *   4. http://localhost:8080 — last-resort local fallback
 */
async function appUrl(): Promise<string> {
  try {
    const { getRequestHost, getRequestProtocol } = await import(
      "@tanstack/react-start/server"
    );
    // xForwardedHost / xForwardedProto respect the headers Netlify (and other
    // reverse proxies) set, so HTTPS and the public hostname are picked up
    // correctly on deployed environments.
    const host     = getRequestHost({ xForwardedHost: true });
    const protocol = getRequestProtocol({ xForwardedProto: true });
    return `${protocol}://${host}`;
  } catch {
    // Not in a request context (shouldn't happen inside a server fn handler,
    // but guard against it just in case).
  }

  return (
    (typeof process !== "undefined"
      ? process.env.VITE_APP_URL ?? process.env.APP_URL ?? process.env.URL
      : undefined) ??
    (import.meta.env.VITE_APP_URL as string | undefined) ??
    "http://localhost:8080"
  );
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SelectedModifierInputSchema = z.object({
  groupName:  z.string().min(1),
  optionName: z.string().min(1),
});

const CheckoutItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity:   z.number().int().positive().max(99),
  selectedModifiers: z.array(SelectedModifierInputSchema).default([]),
});

const CreateCheckoutSessionSchema = z.object({
  restaurantId:        z.string().uuid(),
  /** The restaurant's subdomain — used to build branded tracking/cancel URLs. */
  restaurantSubdomain: z.string().optional(),
  customerName:        z.string().min(1).max(100),
  customerPhone:       z.string().max(30).optional(),
  customerEmail:       z.union([z.string().email(), z.literal("")]).optional(),
  fulfilmentType:      z.enum(["pickup", "delivery"]),
  deliveryAddress:     z.string().max(300).optional(),
  notes:               z.string().max(500).optional(),
  source:              z.string().max(100).optional(),
  items:               z.array(CheckoutItemSchema).min(1).max(50),
});

export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;

// ─── createCheckoutSessionForOrder ───────────────────────────────────────────

export const createCheckoutSessionForOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CreateCheckoutSessionInput) =>
    CreateCheckoutSessionSchema.parse(input),
  )
  .handler(async ({ data }): Promise<{ checkoutUrl: string; orderId: string }> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const { getStripe }      = await import("@/lib/stripe/server");

    const db     = getAdminClient();
    const stripe = getStripe();

    // ── 1. Load restaurant — verify Stripe readiness ──────────────────────────
    const { data: restaurant, error: rErr } = await db
      .from("restaurants")
      .select(
        "id, name, slug, subdomain, email, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled",
      )
      .eq("id", data.restaurantId)
      .single();

    if (rErr || !restaurant) throw new Error("Restaurant not found");

    if (!restaurant.stripe_account_id) {
      throw new Error("This restaurant has not connected Stripe yet");
    }
    if (!restaurant.stripe_charges_enabled || !restaurant.stripe_payouts_enabled) {
      throw new Error("This restaurant cannot accept online payments yet — Stripe account is not fully verified");
    }

    // ── 2. Load & validate menu items (server-side price recalculation) ───────
    const menuItemIds = [...new Set(data.items.map((i) => i.menuItemId))];

    const { data: dbItems, error: itemsErr } = await db
      .from("menu_items")
      .select(`
        id, name, price_pence, is_available,
        modifier_groups(
          id, name,
          modifiers(id, name, price_delta_pence, is_available)
        )
      `)
      .in("id", menuItemIds)
      .eq("restaurant_id", data.restaurantId);

    if (itemsErr) throw new Error(`Failed to load menu items: ${itemsErr.message}`);

    type DbModifier = {
      id: string;
      name: string;
      price_delta_pence: number;
      is_available: boolean;
    };
    type DbModifierGroup = {
      id: string;
      name: string;
      modifiers: DbModifier[];
    };
    type DbMenuItem = {
      id: string;
      name: string;
      price_pence: number;
      is_available: boolean;
      modifier_groups: DbModifierGroup[];
    };

    const itemMap = new Map<string, DbMenuItem>();
    for (const item of (dbItems ?? []) as DbMenuItem[]) {
      itemMap.set(item.id, item);
    }

    // ── 3. Recalculate totals server-side ─────────────────────────────────────
    type ProcessedItem = {
      menuItemId: string;
      name: string;
      quantity: number;
      unitPricePence: number;
      totalPence: number;
      selectedModifiers: Array<{ groupName: string; optionName: string; pricePence: number }>;
      lineItemDescription: string | undefined;
    };

    const processedItems: ProcessedItem[] = [];

    for (const cartItem of data.items) {
      const dbItem = itemMap.get(cartItem.menuItemId);
      if (!dbItem) {
        throw new Error(`Menu item not found or doesn't belong to this restaurant`);
      }
      if (!dbItem.is_available) {
        throw new Error(`"${dbItem.name}" is currently unavailable`);
      }

      let unitPricePence = dbItem.price_pence;
      const resolvedModifiers: Array<{ groupName: string; optionName: string; pricePence: number }> = [];

      for (const mod of cartItem.selectedModifiers) {
        const group = (dbItem.modifier_groups ?? []).find(
          (g) => g.name.toLowerCase() === mod.groupName.toLowerCase(),
        );
        if (!group) continue;

        const modifier = (group.modifiers ?? []).find(
          (m) => m.name.toLowerCase() === mod.optionName.toLowerCase(),
        );
        if (!modifier) continue;

        unitPricePence += modifier.price_delta_pence;
        resolvedModifiers.push({
          groupName:  group.name,
          optionName: modifier.name,
          pricePence: modifier.price_delta_pence,
        });
      }

      processedItems.push({
        menuItemId:          cartItem.menuItemId,
        name:                dbItem.name,
        quantity:            cartItem.quantity,
        unitPricePence,
        totalPence:          unitPricePence * cartItem.quantity,
        selectedModifiers:   resolvedModifiers,
        lineItemDescription: resolvedModifiers.length > 0
          ? resolvedModifiers.map((m) => m.optionName).join(", ")
          : undefined,
      });
    }

    const subtotalPence = processedItems.reduce((s, i) => s + i.totalPence, 0);

    // ── 4. Calculate delivery fee from DB ─────────────────────────────────────
    let deliveryFeePence = 0;
    if (data.fulfilmentType === "delivery") {
      const { data: fulfilment } = await db
        .from("fulfilment_settings")
        .select("delivery_fee_pence, delivery_enabled, minimum_delivery_order_pence")
        .eq("restaurant_id", data.restaurantId)
        .maybeSingle();

      if (!fulfilment?.delivery_enabled) {
        throw new Error("Delivery is not available for this restaurant");
      }
      deliveryFeePence = fulfilment.delivery_fee_pence ?? 0;

      if (
        fulfilment.minimum_delivery_order_pence &&
        subtotalPence < fulfilment.minimum_delivery_order_pence
      ) {
        const minGbp = (fulfilment.minimum_delivery_order_pence / 100).toFixed(2);
        throw new Error(`Minimum order for delivery is £${minGbp}`);
      }
    }

    const totalPence = subtotalPence + deliveryFeePence;

    // ── 5. Generate order number, name, and tracking token ───────────────────
    const { count } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", data.restaurantId);
    const orderNumber = `#${1000 + (count ?? 0) + 1}`;
    const firstName   = data.customerName.trim().split(/\s+/)[0] ?? data.customerName.trim();
    const orderName   = `${orderNumber} ${firstName}`;

    // Tracking token (server-only — uses node:crypto)
    const { generateTrackingToken, buildTrackingUrl } = await import(
      "@/server/lib/tracking-token"
    );
    const subdomain = data.restaurantSubdomain ?? restaurant.subdomain ?? null;
    const trackingToken = generateTrackingToken();
    const trackingUrl   = buildTrackingUrl(trackingToken, subdomain);

    // ── 6. Build combined notes (order notes + delivery address) ──────────────
    const fullNotes = [
      data.notes,
      data.fulfilmentType === "delivery" && data.deliveryAddress
        ? `Address: ${data.deliveryAddress}`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    // ── 7. Create order in DB with payment_status = 'pending' ─────────────────
    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        restaurant_id:             data.restaurantId,
        order_number:              orderNumber,
        order_name:                orderName,
        customer_name:             data.customerName.trim(),
        customer_phone:            data.customerPhone?.trim() || null,
        customer_email:            data.customerEmail?.trim().toLowerCase() || null,
        fulfilment_type:           data.fulfilmentType,
        subtotal_pence:            subtotalPence,
        delivery_fee_pence:        deliveryFeePence,
        total_pence:               totalPence,
        notes:                     fullNotes || null,
        source:                    data.source || null,
        status:                    "pending",
        payment_status:            "pending",
        stripe_account_id:         restaurant.stripe_account_id,
        tracking_token:            trackingToken,
        tracking_token_created_at: new Date().toISOString(),
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) throw new Error(`Failed to create order: ${orderErr?.message}`);

    // ── 8. Insert order items ─────────────────────────────────────────────────
    const { error: itemsInsertErr } = await db.from("order_items").insert(
      processedItems.map((item) => ({
        restaurant_id:      data.restaurantId,
        order_id:           order.id,
        menu_item_id:       item.menuItemId,
        name:               item.name,
        quantity:           item.quantity,
        unit_price_pence:   item.unitPricePence,
        total_pence:        item.totalPence,
        selected_modifiers: item.selectedModifiers as never,
      })),
    );

    if (itemsInsertErr) throw new Error(`Failed to save order items: ${itemsInsertErr.message}`);

    // ── 9. Upsert customer (best-effort, non-fatal) ───────────────────────────
    try {
      const phone = data.customerPhone?.trim() || null;
      const email = data.customerEmail?.trim().toLowerCase() || null;
      let existing: { id: string; total_orders: number; total_spend_pence: number } | null = null;

      if (phone) {
        const { data: row } = await db
          .from("customers")
          .select("id, total_orders, total_spend_pence")
          .eq("restaurant_id", data.restaurantId)
          .eq("phone", phone)
          .maybeSingle();
        existing = row ?? null;
      } else if (email) {
        const { data: row } = await db
          .from("customers")
          .select("id, total_orders, total_spend_pence")
          .eq("restaurant_id", data.restaurantId)
          .eq("email", email)
          .maybeSingle();
        existing = row ?? null;
      }

      if (existing) {
        await db.from("customers").update({
          name:              data.customerName.trim(),
          ...(email ? { email } : {}),
          total_orders:      (existing.total_orders ?? 0) + 1,
          total_spend_pence: (existing.total_spend_pence ?? 0) + totalPence,
          last_order_at:     new Date().toISOString(),
        }).eq("id", existing.id);
      } else if (phone || email) {
        await db.from("customers").insert({
          restaurant_id:     data.restaurantId,
          name:              data.customerName.trim(),
          email,
          phone,
          total_orders:      1,
          total_spend_pence: totalPence,
          last_order_at:     new Date().toISOString(),
        });
      }
    } catch {
      // Non-fatal — customer record failure must not block order creation
    }

    // ── 10. Build Stripe line items ───────────────────────────────────────────
    type StripeLineItem = {
      price_data: {
        currency: string;
        unit_amount: number;
        product_data: { name: string; description?: string };
      };
      quantity: number;
    };

    const lineItems: StripeLineItem[] = processedItems.map((item) => ({
      price_data: {
        currency:     "gbp",
        unit_amount:  item.unitPricePence,
        product_data: {
          name:        item.name,
          ...(item.lineItemDescription
            ? { description: item.lineItemDescription }
            : {}),
        },
      },
      quantity: item.quantity,
    }));

    if (deliveryFeePence > 0) {
      lineItems.push({
        price_data: {
          currency:     "gbp",
          unit_amount:  deliveryFeePence,
          product_data: { name: "Delivery fee" },
        },
        quantity: 1,
      });
    }

    // ── 11. Create Stripe Checkout Session (destination charge) ───────────────
    const base = await appUrl();
    // Use subdomain storefront URL for cancel so customers land on the right host
    const { getRestaurantPublicUrl } = await import("@/lib/tenant/get-public-url");
    const storefrontUrl = getRestaurantPublicUrl({ subdomain, slug: restaurant.slug });
    const session = await stripe.checkout.sessions.create({
      mode:                "payment",
      payment_method_types: ["card"],
      line_items:          lineItems,
      metadata: {
        order_id:       order.id,
        order_number:   orderNumber,
        restaurant_id:  data.restaurantId,
        restaurant_slug: restaurant.slug,
        source:         data.source || "",
        environment:    typeof process !== "undefined" && process.env.NODE_ENV === "production"
          ? "production"
          : "development",
      },
      payment_intent_data: {
        // Destination charge — funds transferred to connected account
        transfer_data: {
          destination: restaurant.stripe_account_id,
        },
        metadata: {
          order_id:      order.id,
          restaurant_id: data.restaurantId,
        },
      },
      customer_email: data.customerEmail?.trim().toLowerCase() || undefined,
      success_url: `${base}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${storefrontUrl}?payment=cancelled&order=${order.id}`,
    });

    // ── 12. Save session id to order ──────────────────────────────────────────
    await db
      .from("orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    // ── 13. Dispatch order.created event to n8n (best-effort) ─────────────────
    // Note: we do NOT emit new_order notification here — the order isn't paid
    // yet. The Stripe webhook (checkout.session.completed) emits the staff
    // notification once payment is confirmed.
    try {
      const { emitOrderEvent } = await import("@/server/events/order-events");
      await emitOrderEvent("order_status", {
        restaurantId:   data.restaurantId,
        orderId:        order.id,
        orderNumber,
        orderName,
        customerName:   data.customerName.trim(),
        customerPhone:  data.customerPhone?.trim() || null,
        customerEmail:  data.customerEmail?.trim().toLowerCase() || null,
        fulfilmentType: data.fulfilmentType,
        totalPence,
        status:         "pending",
        paymentStatus:  "pending",
        source:         data.source ?? null,
        trackingUrl,
      });
    } catch {
      // Non-fatal
    }

    return {
      checkoutUrl: session.url!,
      orderId:     order.id as string,
    };
  });

// ─── retryCheckoutSessionForOrder ────────────────────────────────────────────

/**
 * Creates a new Stripe Checkout Session for an existing order whose
 * previous session was cancelled or expired.  Order must be in
 * payment_status = 'pending' | 'failed' | 'cancelled'.
 */
export const retryCheckoutSessionForOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data: { orderId } }): Promise<{ checkoutUrl: string }> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const { getStripe }      = await import("@/lib/stripe/server");

    const db     = getAdminClient();
    const stripe = getStripe();

    // Load order + restaurant
    const { data: order, error: oErr } = await db
      .from("orders")
      .select("*, restaurants(id, name, slug, subdomain, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled)")
      .eq("id", orderId)
      .single();

    if (oErr || !order) throw new Error("Order not found");
    if (order.payment_status === "paid") throw new Error("Order is already paid");

    const restaurant = Array.isArray(order.restaurants)
      ? order.restaurants[0]
      : order.restaurants as {
          id: string; name: string; slug: string; subdomain: string | null;
          stripe_account_id: string | null;
          stripe_charges_enabled: boolean;
          stripe_payouts_enabled: boolean;
        } | null;

    if (!restaurant?.stripe_account_id) throw new Error("Stripe not connected");
    if (!restaurant.stripe_charges_enabled || !restaurant.stripe_payouts_enabled) {
      throw new Error("Stripe account is not fully verified");
    }

    // Load order items for line items
    const { data: orderItems } = await db
      .from("order_items")
      .select("name, quantity, unit_price_pence, selected_modifiers")
      .eq("order_id", orderId);

    const lineItems = (orderItems ?? []).map((item) => {
      const mods = item.selected_modifiers as Array<{ optionName: string }> | null;
      const desc = mods?.map((m) => m.optionName).join(", ") || undefined;
      return {
        price_data: {
          currency:     "gbp",
          unit_amount:  item.unit_price_pence,
          product_data: { name: item.name, ...(desc ? { description: desc } : {}) },
        },
        quantity: item.quantity,
      };
    });

    if (order.delivery_fee_pence > 0) {
      lineItems.push({
        price_data: {
          currency:     "gbp",
          unit_amount:  order.delivery_fee_pence,
          product_data: { name: "Delivery fee" },
        },
        quantity: 1,
      });
    }

    const base = await appUrl();
    const { getRestaurantPublicUrl: getPubUrl } = await import("@/lib/tenant/get-public-url");
    const retryStoUrl = getPubUrl({ subdomain: restaurant.subdomain ?? null, slug: restaurant.slug });
    const session = await stripe.checkout.sessions.create({
      mode:                "payment",
      payment_method_types: ["card"],
      line_items:          lineItems,
      metadata: {
        order_id:       orderId,
        order_number:   order.order_number,
        restaurant_id:  order.restaurant_id,
        restaurant_slug: restaurant.slug,
        source:         order.source || "",
      },
      payment_intent_data: {
        transfer_data: { destination: restaurant.stripe_account_id },
        metadata: { order_id: orderId, restaurant_id: order.restaurant_id },
      },
      customer_email: order.customer_email ?? undefined,
      success_url: `${base}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${retryStoUrl}?payment=cancelled&order=${orderId}`,
    });

    await db
      .from("orders")
      .update({ stripe_checkout_session_id: session.id, payment_status: "pending" })
      .eq("id", orderId);

    return { checkoutUrl: session.url! };
  });

// ─── getPaymentStatusForOrder ─────────────────────────────────────────────────

export type PaymentStatusResult = {
  found: boolean;
  orderId: string | null;
  orderNumber: string | null;
  paymentStatus: string | null;
  totalPence: number | null;
  customerName: string | null;
  fulfilmentType: string | null;
  restaurantName: string | null;
  restaurantSlug: string | null;
  estimatedMinutes: number | null;
  /** Tracking token — used to build the /track/$token URL on the client */
  trackingToken: string | null;
};

/**
 * Looks up an order by Stripe checkout session id.
 * If the DB still shows 'pending', cross-checks Stripe live to catch
 * webhook-delay edge cases, and updates DB + returns 'paid' if Stripe confirms.
 */
export const getPaymentStatusForOrder = createServerFn({ method: "GET" })
  .inputValidator((input: { sessionId: string }) =>
    z.object({ sessionId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data: { sessionId } }): Promise<PaymentStatusResult> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const { getStripe }      = await import("@/lib/stripe/server");

    const db     = getAdminClient();
    const stripe = getStripe();

    const notFound: PaymentStatusResult = {
      found: false, orderId: null, orderNumber: null, paymentStatus: null,
      totalPence: null, customerName: null, fulfilmentType: null,
      restaurantName: null, restaurantSlug: null, estimatedMinutes: null,
      trackingToken: null,
    };

    // Look up order by session id
    const { data: order } = await db
      .from("orders")
      .select(`
        id, order_number, payment_status, total_pence,
        customer_name, fulfilment_type, restaurant_id, tracking_token,
        restaurants(name, slug, fulfilment_settings(pickup_prep_time_minutes, delivery_time_minutes))
      `)
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (!order) return notFound;

    const rest = Array.isArray(order.restaurants)
      ? order.restaurants[0]
      : order.restaurants as {
          name: string; slug: string;
          fulfilment_settings: Array<{ pickup_prep_time_minutes: number; delivery_time_minutes: number }> | null;
        } | null;

    const fulOpts = Array.isArray(rest?.fulfilment_settings)
      ? rest!.fulfilment_settings[0]
      : rest?.fulfilment_settings as { pickup_prep_time_minutes: number; delivery_time_minutes: number } | null;

    const estimatedMinutes = order.fulfilment_type === "delivery"
      ? (fulOpts?.delivery_time_minutes ?? 45)
      : (fulOpts?.pickup_prep_time_minutes ?? 20);

    // If DB already shows paid — return immediately
    if (order.payment_status === "paid") {
      return {
        found:            true,
        orderId:          order.id,
        orderNumber:      order.order_number,
        paymentStatus:    "paid",
        totalPence:       order.total_pence,
        customerName:     order.customer_name,
        fulfilmentType:   order.fulfilment_type,
        restaurantName:   rest?.name ?? null,
        restaurantSlug:   rest?.slug ?? null,
        estimatedMinutes,
        trackingToken:    (order as { tracking_token?: string | null }).tracking_token ?? null,
      };
    }

    // If still pending — cross-check Stripe directly (handles webhook delay)
    try {
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });

      if (stripeSession.payment_status === "paid") {
        const pi = typeof stripeSession.payment_intent === "string"
          ? stripeSession.payment_intent
          : stripeSession.payment_intent?.id ?? null;

        // Eagerly update DB — the webhook may follow, which is idempotent
        await db.from("orders").update({
          payment_status:            "paid",
          stripe_payment_intent_id:  pi,
          paid_at:                   new Date().toISOString(),
        }).eq("id", order.id);

        // Track event (best-effort)
        try {
          await db.from("events").insert({
            restaurant_id: order.restaurant_id,
            type:          "order.paid",
            payload:       {
              order_id:      order.id,
              order_number:  order.order_number,
              total_pence:   order.total_pence,
              source:        "success_page_check",
            } as never,
          });
        } catch { /* non-fatal */ }

        return {
          found:            true,
          orderId:          order.id,
          orderNumber:      order.order_number,
          paymentStatus:    "paid",
          totalPence:       order.total_pence,
          customerName:     order.customer_name,
          fulfilmentType:   order.fulfilment_type,
          restaurantName:   rest?.name ?? null,
          restaurantSlug:   rest?.slug ?? null,
          estimatedMinutes,
          trackingToken:    (order as { tracking_token?: string | null }).tracking_token ?? null,
        };
      }
    } catch {
      // Stripe API check failed — fall through and return DB state
    }

    return {
      found:            true,
      orderId:          order.id,
      orderNumber:      order.order_number,
      paymentStatus:    order.payment_status,
      totalPence:       order.total_pence,
      customerName:     order.customer_name,
      fulfilmentType:   order.fulfilment_type,
      restaurantName:   rest?.name ?? null,
      restaurantSlug:   rest?.slug ?? null,
      estimatedMinutes,
      trackingToken:    (order as { tracking_token?: string | null }).tracking_token ?? null,
    };
  });
