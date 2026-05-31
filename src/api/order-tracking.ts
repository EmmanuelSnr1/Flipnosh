/**
 * Public order tracking API — no authentication required.
 *
 * Exposes only customer-safe data: no internal IDs, Stripe IDs, or PII
 * beyond what the customer already knows about their own order.
 *
 * Lookup is by tracking_token (128-bit random, unguessable).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Public types ─────────────────────────────────────────────────────────────

export type TrackingOrderItem = {
  id:                 string;
  name:               string;
  quantity:           number;
  selected_modifiers: Array<{ groupName: string; optionName: string }> | null;
};

export type TrackingMessage = {
  id:          string;
  sender_type: "customer" | "restaurant";
  message:     string;
  created_at:  string;
};

export type OrderTrackingResult =
  | {
      found:             false;
    }
  | {
      found:             true;
      // Restaurant info
      restaurantName:    string;
      restaurantLogoUrl: string | null;
      restaurantSlug:    string;
      restaurantPhone:   string | null;
      restaurantAddress: string | null;
      // Order
      orderId:           string;
      orderNumber:       string;
      orderName:         string | null;
      status:            string;
      paymentStatus:     string;
      fulfilmentType:    string;
      totalPence:        number;
      createdAt:         string;
      estimatedMinutes:  number;
      items:             TrackingOrderItem[];
      messages:          TrackingMessage[];
    };

// ─── getOrderTrackingByToken ──────────────────────────────────────────────────

export const getOrderTrackingByToken = createServerFn({ method: "GET" })
  .inputValidator((token: string) => z.string().min(1).parse(token))
  .handler(async ({ data: token }): Promise<OrderTrackingResult> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data: order } = await db
      .from("orders")
      .select(`
        id, order_number, order_name, status, payment_status,
        fulfilment_type, total_pence, created_at,
        restaurants (
          name, slug, phone, address, postcode,
          restaurant_branding ( logo_url ),
          fulfilment_settings ( pickup_prep_time_minutes, delivery_time_minutes )
        ),
        order_items ( id, name, quantity, selected_modifiers ),
        order_messages ( id, sender_type, message, created_at )
      `)
      .eq("tracking_token", token)
      .maybeSingle();

    if (!order) return { found: false };

    // ── Unwrap joined relations ────────────────────────────────────────────────
    const rest = Array.isArray(order.restaurants)
      ? order.restaurants[0]
      : (order.restaurants as {
          name: string;
          slug: string;
          phone: string | null;
          address: string | null;
          postcode: string | null;
          restaurant_branding:
            | Array<{ logo_url: string | null }>
            | { logo_url: string | null }
            | null;
          fulfilment_settings:
            | Array<{ pickup_prep_time_minutes: number; delivery_time_minutes: number }>
            | { pickup_prep_time_minutes: number; delivery_time_minutes: number }
            | null;
        } | null);

    if (!rest) return { found: false };

    const branding = Array.isArray(rest.restaurant_branding)
      ? rest.restaurant_branding[0]
      : (rest.restaurant_branding as { logo_url: string | null } | null);

    const fulOpts = Array.isArray(rest.fulfilment_settings)
      ? rest.fulfilment_settings[0]
      : (rest.fulfilment_settings as {
          pickup_prep_time_minutes: number;
          delivery_time_minutes: number;
        } | null);

    const estimatedMinutes =
      order.fulfilment_type === "delivery"
        ? (fulOpts?.delivery_time_minutes ?? 45)
        : (fulOpts?.pickup_prep_time_minutes ?? 20);

    const items: TrackingOrderItem[] = (order.order_items ?? []).map((item) => ({
      id:                 item.id,
      name:               item.name,
      quantity:           item.quantity,
      selected_modifiers: item.selected_modifiers as Array<{
        groupName: string;
        optionName: string;
      }> | null,
    }));

    const rawMessages = (order as Record<string, unknown>).order_messages as Array<{
      id: string;
      sender_type: string;
      message: string;
      created_at: string;
    }> | null ?? [];

    const messages: TrackingMessage[] = rawMessages
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((m) => ({
        id:          m.id,
        sender_type: m.sender_type as "customer" | "restaurant",
        message:     m.message,
        created_at:  m.created_at,
      }));

    const address = [rest.address, rest.postcode].filter(Boolean).join(", ") || null;

    return {
      found:             true,
      restaurantName:    rest.name,
      restaurantLogoUrl: branding?.logo_url ?? null,
      restaurantSlug:    rest.slug,
      restaurantPhone:   rest.phone,
      restaurantAddress: address,
      orderId:           order.id,
      orderNumber:       order.order_number,
      orderName:         order.order_name,
      status:            order.status,
      paymentStatus:     order.payment_status,
      fulfilmentType:    order.fulfilment_type,
      totalPence:        order.total_pence,
      createdAt:         order.created_at,
      estimatedMinutes,
      items,
      messages,
    };
  });

// ─── addOrderMessage ──────────────────────────────────────────────────────────
// Public — customer sends a note on their order via the tracking page.
// The tracking token acts as the auth: only someone with the link can message.

export const addOrderMessage = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; message: string }) =>
    z.object({
      token:   z.string().min(1),
      message: z.string().min(1).max(500).transform((s) => s.trim()),
    }).parse(input),
  )
  .handler(async ({ data: { token, message } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Resolve order + restaurant from token
    const { data: order } = await db
      .from("orders")
      .select("id, restaurant_id")
      .eq("tracking_token", token)
      .maybeSingle();

    if (!order) throw new Error("Order not found");

    const { error } = await db.from("order_messages").insert({
      order_id:      order.id,
      restaurant_id: order.restaurant_id,
      sender_type:   "customer",
      message,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
