/**
 * Dashboard server functions
 *
 * All functions use the admin client with explicit restaurantId — the caller
 * is responsible for ensuring the user owns the restaurant (enforced by the
 * /dashboard parent route requiring a valid ?r= search param from login).
 *
 * Lazy Supabase imports keep this file safe for client-side route imports
 * (avoids the TanStack Start import-protection block on files in server/ directories).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Shared search validator ──────────────────────────────────────────────────
// All dashboard routes declare this so the `r` param flows through loaders.

export const dashboardSearch = (s: Record<string, unknown>) => ({
  r: typeof s.r === "string" ? s.r : (undefined as string | undefined),
});

// ─── Order status helpers (replaces mock-store constants) ─────────────────────

// Forward transitions (primary action buttons)
export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  pending:   ["accepted", "rejected"],
  accepted:  ["preparing", "rejected"],
  preparing: ["ready",    "rejected"],
  ready:     ["completed"],
  completed: [],
  rejected:  [],
};

// Backward transitions (revert / fix-mistake button)
export const ORDER_STATUS_BACK: Record<string, string | null> = {
  pending:   null,       // already the first step
  accepted:  "pending",
  preparing: "accepted",
  ready:     "preparing",
  completed: null,       // terminal — cannot undo
  rejected:  null,       // terminal — cannot undo
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:   "Pending",
  accepted:  "Accepted",
  preparing: "Preparing",
  ready:     "Ready for pickup",
  completed: "Completed",
  rejected:  "Rejected",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type DbRestaurant = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  onboarding_completed: boolean;
  cuisine_type: string | null;
  hours: string | null;
  // Stripe Connect
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  /** true when charges_enabled && payouts_enabled */
  can_accept_online_payments: boolean;
};

export type DbBranding = {
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
} | null;

export type DbTheme = {
  theme_name: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  button_color: string;
  text_color: string;
  hero_layout: string;
  menu_layout: string;
  category_navigation: string;
  cart_style: string;
  show_featured_items: boolean;
  show_opening_hours: boolean;
  show_badges: boolean;
  show_reviews: boolean;
  cta_text: string;
  enabled_pages: string[];
} | null;

export type DbFulfilment = {
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  pickup_prep_time_minutes: number;
  delivery_time_minutes: number;
  delivery_radius_miles: number;
  delivery_fee_pence: number;
  minimum_delivery_order_pence: number;
} | null;

export type DashboardContext = {
  restaurant: DbRestaurant;
  branding: DbBranding;
  theme: DbTheme;
  fulfilment: DbFulfilment;
  subscription: {
    plan: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  } | null;
};

export type DashboardOrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit_price_pence: number;
  total_pence: number;
  selected_modifiers: Array<{ groupName: string; optionName: string; pricePence: number }> | null;
};

export type OrderMessage = {
  id:          string;
  sender_type: "customer" | "restaurant";
  message:     string;
  created_at:  string;
};

export type DashboardOrder = {
  id: string;
  order_number: string;
  order_name: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  fulfilment_type: string;
  status: string;
  payment_status: string;
  subtotal_pence: number;
  delivery_fee_pence: number;
  total_pence: number;
  notes: string | null;
  source: string | null;
  created_at: string;
  // Refund tracking
  refunded_at: string | null;
  refund_amount_pence: number | null;
  // Messages thread
  messages: OrderMessage[];
  items: DashboardOrderItem[];
};

export type DashboardNotification = {
  id: string;
  restaurant_id: string;
  type: string;
  title: string;
  body: string;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type DashboardModifier = {
  id: string;
  name: string;
  price_delta_pence: number;
  is_available: boolean;
};

export type DashboardModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  min_select: number;
  max_select: number;
  modifiers: DashboardModifier[];
};

export type DashboardMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_pence: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  dietary_labels: string[];
  allergens: string[];
  calories_kcal: number | null;
  spice_level: number;
  modifier_groups: DashboardModifierGroup[];
};

export type DashboardMenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: DashboardMenuItem[];
};

export type DashboardMenuData = {
  menuId: string;
  categories: DashboardMenuCategory[];
};

export type DashboardCustomer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  total_orders: number;
  total_spend_pence: number;
  last_order_at: string | null;
};

// ─── getDashboardContext ──────────────────────────────────────────────────────

export const getDashboardContext = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardContext> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data, error } = await db
      .from("restaurants")
      .select(
        `
        id, name, slug, city, address, postcode, phone, email,
        status, onboarding_completed, cuisine_type, hours,
        stripe_account_id, stripe_onboarding_complete,
        stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted,
        restaurant_branding (*),
        restaurant_theme_configs (*),
        fulfilment_settings (*),
        platform_subscriptions (*)
      `,
      )
      .eq("id", restaurantId)
      .single();

    if (error) throw new Error(`Restaurant not found: ${restaurantId}`);

    const flatten = <T>(v: T[] | T | null): T | null => {
      if (Array.isArray(v)) return v[0] ?? null;
      return v ?? null;
    };

    const branding = flatten(data.restaurant_branding as never) as DbBranding;
    const rawTheme = flatten(data.restaurant_theme_configs as never) as Record<string, unknown> | null;
    const rawFul = flatten(data.fulfilment_settings as never) as Record<string, unknown> | null;
    const rawSub = flatten(data.platform_subscriptions as never) as Record<string, unknown> | null;

    const theme: DbTheme = rawTheme
      ? {
          theme_name: (rawTheme.theme_name as string) ?? "classic",
          primary_color: (rawTheme.primary_color as string) ?? "#f97316",
          accent_color: (rawTheme.accent_color as string) ?? "#f97316",
          background_color: (rawTheme.background_color as string) ?? "#ffffff",
          button_color: (rawTheme.button_color as string) ?? "#f97316",
          text_color: (rawTheme.text_color as string) ?? "#18181b",
          hero_layout: (rawTheme.hero_layout as string) ?? "image",
          menu_layout: (rawTheme.menu_layout as string) ?? "list",
          category_navigation: (rawTheme.category_navigation as string) ?? "tabs",
          cart_style: (rawTheme.cart_style as string) ?? "drawer",
          show_featured_items: (rawTheme.show_featured_items as boolean) ?? true,
          show_opening_hours: (rawTheme.show_opening_hours as boolean) ?? true,
          show_badges: (rawTheme.show_badges as boolean) ?? true,
          show_reviews: (rawTheme.show_reviews as boolean) ?? false,
          cta_text: (rawTheme.cta_text as string) ?? "Order Now",
          enabled_pages: (rawTheme.enabled_pages as string[]) ?? ["home", "menu", "contact"],
        }
      : null;

    const fulfilment: DbFulfilment = rawFul
      ? {
          pickup_enabled: (rawFul.pickup_enabled as boolean) ?? true,
          delivery_enabled: (rawFul.delivery_enabled as boolean) ?? false,
          pickup_prep_time_minutes: (rawFul.pickup_prep_time_minutes as number) ?? 20,
          delivery_time_minutes: (rawFul.delivery_time_minutes as number) ?? 45,
          delivery_radius_miles: (rawFul.delivery_radius_miles as number) ?? 3,
          delivery_fee_pence: (rawFul.delivery_fee_pence as number) ?? 250,
          minimum_delivery_order_pence: (rawFul.minimum_delivery_order_pence as number) ?? 1500,
        }
      : null;

    return {
      restaurant: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        city: data.city,
        address: data.address,
        postcode: data.postcode,
        phone: data.phone,
        email: data.email,
        status: data.status,
        onboarding_completed: data.onboarding_completed,
        cuisine_type: data.cuisine_type,
        hours: data.hours as string | null,
        stripe_account_id: data.stripe_account_id,
        stripe_onboarding_complete: data.stripe_onboarding_complete,
        stripe_charges_enabled: data.stripe_charges_enabled,
        stripe_payouts_enabled: data.stripe_payouts_enabled,
        stripe_details_submitted: data.stripe_details_submitted,
        can_accept_online_payments: data.stripe_charges_enabled && data.stripe_payouts_enabled,
      },
      branding,
      theme,
      fulfilment,
      subscription: rawSub
        ? {
            plan: rawSub.plan as string,
            status: rawSub.status as string,
            trial_ends_at: (rawSub.trial_ends_at as string | null) ?? null,
            current_period_end: (rawSub.current_period_end as string | null) ?? null,
          }
        : null,
    };
  });

// ─── getDashboardOrders ───────────────────────────────────────────────────────

export const getDashboardOrders = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardOrder[]> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data, error } = await db
      .from("orders")
      .select(`
        *,
        order_items (id, name, quantity, unit_price_pence, total_pence, selected_modifiers),
        order_messages (id, sender_type, message, created_at)
      `)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return (data ?? []).map((o) => {
      const raw = o as Record<string, unknown>;
      const rawMessages = (raw.order_messages as Array<{
        id: string; sender_type: string; message: string; created_at: string;
      }> | null) ?? [];

      return {
        id: o.id,
        order_number: o.order_number,
        order_name: raw.order_name as string | null ?? null,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        customer_email: o.customer_email,
        fulfilment_type: o.fulfilment_type,
        status: o.status,
        payment_status: o.payment_status,
        subtotal_pence: o.subtotal_pence,
        delivery_fee_pence: o.delivery_fee_pence,
        total_pence: o.total_pence,
        notes: o.notes,
        source: raw.source as string | null ?? null,
        created_at: o.created_at,
        refunded_at: o.refunded_at ?? null,
        refund_amount_pence: o.refund_amount_pence ?? null,
        messages: rawMessages
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((m) => ({
            id:          m.id,
            sender_type: m.sender_type as "customer" | "restaurant",
            message:     m.message,
            created_at:  m.created_at,
          })),
        items: (o.order_items ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unit_price_pence: i.unit_price_pence,
          total_pence: i.total_pence,
          selected_modifiers: (i.selected_modifiers as Array<{ groupName: string; optionName: string; pricePence: number }> | null) ?? [],
        })),
      };
    });
  });

// ─── getDashboardMenu ─────────────────────────────────────────────────────────

export const getDashboardMenu = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardMenuData | null> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Get the active menu (or first)
    // Prefer the active menu; fall back to the most recently created
    const { data: menus, error: mErr } = await db
      .from("menus")
      .select("id, is_active")
      .eq("restaurant_id", restaurantId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true });

    if (mErr) throw new Error(mErr.message);
    const activeMenu = menus?.[0];
    if (!activeMenu) return null;

    const { data: cats, error: cErr } = await db
      .from("menu_categories")
      .select(`
        id, name, sort_order,
        menu_items (
          id, name, description, price_pence, image_url, is_available, is_featured, sort_order, dietary_labels, allergens, calories_kcal, spice_level,
          modifier_groups (
            id, name, required, min_select, max_select,
            modifiers (id, name, price_delta_pence, is_available)
          )
        )
      `)
      .eq("restaurant_id", restaurantId)
      .eq("menu_id", activeMenu.id)
      .order("sort_order");

    if (cErr) throw new Error(cErr.message);

    return {
      menuId: activeMenu.id,
      categories: (cats ?? []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        sort_order: cat.sort_order,
        items: [...((cat.menu_items as DashboardMenuItem[]) ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order),
      })),
    };
  });

// ─── getDashboardCustomers ────────────────────────────────────────────────────

export const getDashboardCustomers = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardCustomer[]> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data, error } = await db
      .from("customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("total_spend_pence", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      total_orders: c.total_orders,
      total_spend_pence: c.total_spend_pence,
      last_order_at: c.last_order_at,
    }));
  });

// ─── updateOrderStatus ────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  "pending", "accepted", "preparing", "ready", "completed", "rejected",
] as const;

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { orderId: string; status: (typeof ORDER_STATUSES)[number] }) =>
      z
        .object({ orderId: z.string().uuid(), status: z.enum(ORDER_STATUSES) })
        .parse(input),
  )
  .handler(async ({ data: { orderId, status } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Load full order (include Stripe fields for potential refund)
    const { data: order, error: fetchErr } = await db
      .from("orders")
      .select("id, restaurant_id, order_number, order_name, customer_name, customer_phone, customer_email, fulfilment_type, total_pence, payment_status, source, stripe_payment_intent_id")
      .eq("id", orderId)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const { data, error } = await db
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // ── Auto-refund: if rejecting a paid Stripe order, refund immediately ─────
    if (status === "rejected" && order.payment_status === "paid") {
      const piId = order.stripe_payment_intent_id;
      if (piId) {
        try {
          const stripeKey = process.env.STRIPE_SECRET_KEY;
          if (stripeKey) {
            const Stripe = (await import("stripe")).default;
            const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" });
            const refund = await stripe.refunds.create({ payment_intent: piId });
            await db.from("orders").update({
              payment_status:      "refunded",
              refunded_at:         new Date().toISOString(),
              refund_amount_pence: refund.amount,
              stripe_refund_id:    refund.id,
            } as never).eq("id", orderId);
          }
        } catch (refundErr) {
          // Non-fatal — rejection still goes through even if the Stripe call fails.
          // The dashboard will show the order as rejected without a refund badge,
          // and staff can manually issue the refund from the Stripe dashboard.
          console.error("[refund] Stripe refund failed for order", orderId, refundErr);
        }
      }
    }

    // Emit order_status event to n8n (fire-and-forget, non-fatal)
    // This triggers customer notifications (SMS / email) via n8n automations.
    try {
      const { emitOrderEvent } = await import("@/server/events/order-events");
      await emitOrderEvent("order_status", {
        restaurantId:   order.restaurant_id,
        orderId:        order.id,
        orderNumber:    order.order_number,
        orderName:      (order as Record<string, unknown>).order_name as string | null ?? null,
        customerName:   order.customer_name,
        customerPhone:  order.customer_phone,
        customerEmail:  order.customer_email,
        fulfilmentType: order.fulfilment_type,
        totalPence:     order.total_pence,
        status,
        paymentStatus:  order.payment_status,
        source:         (order as Record<string, unknown>).source as string | null ?? null,
      });
    } catch {
      // Non-fatal — event dispatch must not block status update
    }

    return data;
  });

// ─── updateDashboardMenuItem ──────────────────────────────────────────────────

export const updateDashboardMenuItem = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      name?: string;
      description?: string;
      pricePence?: number;
      isAvailable?: boolean;
      isFeatured?: boolean;
      imageUrl?: string | null;
      dietaryLabels?: string[];
      allergens?: string[];
      caloriesKcal?: number | null;
      spiceLevel?: number;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          pricePence: z.number().int().positive().optional(),
          isAvailable: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          imageUrl: z.string().url().nullable().optional(),
          dietaryLabels: z.array(z.string()).optional(),
          allergens: z.array(z.string()).optional(),
          caloriesKcal: z.number().int().positive().nullable().optional(),
          spiceLevel: z.number().int().min(0).max(3).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data: { id, ...rest } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { data, error } = await db
      .from("menu_items")
      .update({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.description !== undefined && { description: rest.description }),
        ...(rest.pricePence !== undefined && { price_pence: rest.pricePence }),
        ...(rest.isAvailable !== undefined && { is_available: rest.isAvailable }),
        ...(rest.isFeatured !== undefined && { is_featured: rest.isFeatured }),
        ...(rest.imageUrl !== undefined && { image_url: rest.imageUrl }),
        ...(rest.dietaryLabels !== undefined && { dietary_labels: rest.dietaryLabels }),
        ...(rest.allergens !== undefined && { allergens: rest.allergens }),
        ...(rest.caloriesKcal !== undefined && { calories_kcal: rest.caloriesKcal }),
        ...(rest.spiceLevel !== undefined && { spice_level: rest.spiceLevel }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

// ─── createDashboardMenuItem ──────────────────────────────────────────────────

export const createDashboardMenuItem = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      categoryId: string;
      name: string;
      description?: string;
      pricePence: number;
      imageUrl?: string | null;
      isFeatured?: boolean;
      dietaryLabels?: string[];
      allergens?: string[];
      caloriesKcal?: number | null;
      spiceLevel?: number;
    }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          categoryId: z.string().uuid(),
          name: z.string().min(1),
          description: z.string().optional(),
          pricePence: z.number().int().positive(),
          imageUrl: z.string().url().nullable().optional(),
          isFeatured: z.boolean().optional(),
          dietaryLabels: z.array(z.string()).optional(),
          allergens: z.array(z.string()).optional(),
          caloriesKcal: z.number().int().positive().nullable().optional(),
          spiceLevel: z.number().int().min(0).max(3).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Determine next sort_order
    const { count } = await db
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("category_id", data.categoryId);

    const { data: row, error } = await db
      .from("menu_items")
      .insert({
        restaurant_id: data.restaurantId,
        category_id: data.categoryId,
        name: data.name,
        description: data.description,
        price_pence: data.pricePence,
        image_url: data.imageUrl ?? null,
        is_available: true,
        is_featured: data.isFeatured ?? false,
        dietary_labels: data.dietaryLabels ?? [],
        allergens: data.allergens ?? [],
        calories_kcal: data.caloriesKcal ?? null,
        spice_level: data.spiceLevel ?? 0,
        sort_order: count ?? 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

// ─── createDashboardMenuCategory ─────────────────────────────────────────────

export const createDashboardMenuCategory = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string; menuId: string; name: string }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          menuId: z.string().uuid(),
          name: z.string().min(1),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { count } = await db
      .from("menu_categories")
      .select("id", { count: "exact", head: true })
      .eq("menu_id", data.menuId);

    const { data: row, error } = await db
      .from("menu_categories")
      .insert({
        restaurant_id: data.restaurantId,
        menu_id: data.menuId,
        name: data.name,
        sort_order: count ?? 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

// ─── saveRestaurantSettings ───────────────────────────────────────────────────

export const saveRestaurantSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      name?: string;
      phone?: string;
      address?: string;
      postcode?: string;
      city?: string;
      email?: string;
      hours?: string;
    }) => z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurants")
      .update({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.phone !== undefined && { phone: rest.phone }),
        ...(rest.address !== undefined && { address: rest.address }),
        ...(rest.postcode !== undefined && { postcode: rest.postcode }),
        ...(rest.city !== undefined && { city: rest.city }),
        ...(rest.email !== undefined && { email: rest.email }),
        ...(rest.hours !== undefined && { hours: rest.hours }),
      })
      .eq("id", restaurantId);

    if (error) throw new Error(error.message);
  });

// ─── saveFullBranding ─────────────────────────────────────────────────────────

export const saveFullBranding = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      tagline?: string;
      description?: string;
      logoUrl?: string | null;
      heroImageUrl?: string | null;
      instagramUrl?: string;
      tiktokUrl?: string;
      facebookUrl?: string;
    }) => z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurant_branding")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...(rest.tagline !== undefined && { tagline: rest.tagline }),
          ...(rest.description !== undefined && { description: rest.description }),
          ...(rest.logoUrl !== undefined && { logo_url: rest.logoUrl }),
          ...(rest.heroImageUrl !== undefined && { hero_image_url: rest.heroImageUrl }),
          ...(rest.instagramUrl !== undefined && { instagram_url: rest.instagramUrl || null }),
          ...(rest.tiktokUrl !== undefined && { tiktok_url: rest.tiktokUrl || null }),
          ...(rest.facebookUrl !== undefined && { facebook_url: rest.facebookUrl || null }),
        },
        { onConflict: "restaurant_id" },
      );

    if (error) throw new Error(error.message);
  });

// ─── saveFullTheme ────────────────────────────────────────────────────────────

export const saveFullTheme = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string } & Record<string, unknown>) =>
      z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurant_theme_configs")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...(rest.themeName !== undefined && { theme_name: rest.themeName }),
          ...(rest.primaryColor !== undefined && { primary_color: rest.primaryColor }),
          ...(rest.accentColor !== undefined && { accent_color: rest.accentColor }),
          ...(rest.backgroundColor !== undefined && { background_color: rest.backgroundColor }),
          ...(rest.buttonColor !== undefined && { button_color: rest.buttonColor }),
          ...(rest.textColor !== undefined && { text_color: rest.textColor }),
          ...(rest.heroLayout !== undefined && { hero_layout: rest.heroLayout }),
          ...(rest.menuLayout !== undefined && { menu_layout: rest.menuLayout }),
          ...(rest.categoryNavigation !== undefined && { category_navigation: rest.categoryNavigation }),
          ...(rest.cartStyle !== undefined && { cart_style: rest.cartStyle }),
          ...(rest.showFeaturedItems !== undefined && { show_featured_items: rest.showFeaturedItems }),
          ...(rest.showOpeningHours !== undefined && { show_opening_hours: rest.showOpeningHours }),
          ...(rest.showBadges !== undefined && { show_badges: rest.showBadges }),
          ...(rest.showReviews !== undefined && { show_reviews: rest.showReviews }),
          ...(rest.ctaText !== undefined && { cta_text: rest.ctaText }),
          ...(rest.enabledPages !== undefined && { enabled_pages: rest.enabledPages }),
        },
        { onConflict: "restaurant_id" },
      );

    if (error) throw new Error(error.message);
  });

// ─── Modifier-group CRUD ──────────────────────────────────────────────────────

export const addModifierGroup = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string; menuItemId: string; name: string; required?: boolean; maxSelect?: number }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          menuItemId:   z.string().uuid(),
          name:         z.string().min(1),
          required:     z.boolean().default(false),
          maxSelect:    z.number().int().positive().default(1),
        })
        .parse(input),
  )
  .handler(async ({ data }): Promise<Omit<DashboardModifierGroup, "modifiers">> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { data: row, error } = await db
      .from("modifier_groups")
      .insert({
        restaurant_id: data.restaurantId,
        menu_item_id:  data.menuItemId,
        name:          data.name,
        required:      data.required,
        min_select:    data.required ? 1 : 0,
        max_select:    data.maxSelect,
      })
      .select("id, name, required, min_select, max_select")
      .single();
    if (error) throw new Error(error.message);
    return row as Omit<DashboardModifierGroup, "modifiers">;
  });

export const updateModifierGroup = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { id: string; name?: string; required?: boolean; maxSelect?: number }) =>
      z
        .object({
          id:        z.string().uuid(),
          name:      z.string().min(1).optional(),
          required:  z.boolean().optional(),
          maxSelect: z.number().int().positive().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data: { id, name, required, maxSelect } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { error } = await db
      .from("modifier_groups")
      .update({
        ...(name      !== undefined && { name }),
        ...(required  !== undefined && { required, min_select: required ? 1 : 0 }),
        ...(maxSelect !== undefined && { max_select: maxSelect }),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  });

export const deleteModifierGroup = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data: { id } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    // Delete child options first (no CASCADE in FK)
    await db.from("modifiers").delete().eq("group_id", id);
    const { error } = await db.from("modifier_groups").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

// ─── Modifier-option CRUD ─────────────────────────────────────────────────────

export const addModifier = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string; groupId: string; name: string; priceDeltaPence?: number }) =>
      z
        .object({
          restaurantId:    z.string().uuid(),
          groupId:         z.string().uuid(),
          name:            z.string().min(1),
          priceDeltaPence: z.number().int().default(0),
        })
        .parse(input),
  )
  .handler(async ({ data }): Promise<DashboardModifier> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { data: row, error } = await db
      .from("modifiers")
      .insert({
        restaurant_id:     data.restaurantId,
        group_id:          data.groupId,
        name:              data.name,
        price_delta_pence: data.priceDeltaPence,
        is_available:      true,
      })
      .select("id, name, price_delta_pence, is_available")
      .single();
    if (error) throw new Error(error.message);
    return row as DashboardModifier;
  });

export const deleteModifier = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data: { id } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { error } = await db.from("modifiers").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

// ── Delete menu item (cascades modifier groups / modifiers) ───────────────────

export const deleteDashboardMenuItem = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data: { id } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Cascade: modifiers → modifier_groups → item
    const { data: groups } = await db
      .from("modifier_groups")
      .select("id")
      .eq("menu_item_id", id);

    if (groups && groups.length > 0) {
      const groupIds = groups.map((g) => g.id);
      const { error: modErr } = await db
        .from("modifiers")
        .delete()
        .in("group_id", groupIds);
      if (modErr) throw new Error(modErr.message);
      const { error: grpErr } = await db
        .from("modifier_groups")
        .delete()
        .in("id", groupIds);
      if (grpErr) throw new Error(grpErr.message);
    }

    const { error } = await db.from("menu_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

// ── Delete menu category (cascades items → modifier groups → modifiers) ───────

export const deleteDashboardMenuCategory = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data: { id } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data: items } = await db
      .from("menu_items")
      .select("id")
      .eq("category_id", id);

    if (items && items.length > 0) {
      const itemIds = items.map((i) => i.id);

      const { data: groups } = await db
        .from("modifier_groups")
        .select("id")
        .in("menu_item_id", itemIds);

      if (groups && groups.length > 0) {
        const groupIds = groups.map((g) => g.id);
        const { error: modErr } = await db
          .from("modifiers")
          .delete()
          .in("group_id", groupIds);
        if (modErr) throw new Error(modErr.message);
        const { error: grpErr } = await db
          .from("modifier_groups")
          .delete()
          .in("id", groupIds);
        if (grpErr) throw new Error(grpErr.message);
      }

      const { error: itemErr } = await db
        .from("menu_items")
        .delete()
        .in("id", itemIds);
      if (itemErr) throw new Error(itemErr.message);
    }

    const { error } = await db.from("menu_categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

// ─── Notification functions ───────────────────────────────────────────────────

export const getDashboardNotifications = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardNotification[]> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data, error } = await db
      .from("restaurant_notifications")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);

    return (data ?? []) as DashboardNotification[];
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data: { id } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { error } = await db
      .from("restaurant_notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { error } = await db
      .from("restaurant_notifications")
      .update({ is_read: true })
      .eq("restaurant_id", restaurantId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
  });

export const getUnreadNotificationCount = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<number> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { count, error } = await db
      .from("restaurant_notifications")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  });

// ─── sendRestaurantMessage ────────────────────────────────────────────────────
// Restaurant staff replies to a customer on the order thread.

export const sendRestaurantMessage = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { orderId: string; restaurantId: string; message: string }) =>
      z.object({
        orderId:      z.string().uuid(),
        restaurantId: z.string().uuid(),
        message:      z.string().min(1).max(500).transform((s) => s.trim()),
      }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { error } = await db.from("order_messages").insert({
      order_id:      data.orderId,
      restaurant_id: data.restaurantId,
      sender_type:   "restaurant",
      message:       data.message,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
