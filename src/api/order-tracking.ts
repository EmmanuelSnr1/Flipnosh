/**
 * Public order tracking API — no authentication required.
 *
 * Exposes only customer-safe data: no phone, email, internal IDs,
 * Stripe IDs, private notes, or any other PII beyond what the customer
 * already knows about their own order.
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

export type OrderTrackingResult =
  | {
      found:             false;
    }
  | {
      found:             true;
      restaurantName:    string;
      restaurantLogoUrl: string | null;
      restaurantSlug:    string;
      orderNumber:       string;
      orderName:         string | null;
      status:            string;
      paymentStatus:     string;
      fulfilmentType:    string;
      totalPence:        number;
      createdAt:         string;
      estimatedMinutes:  number;
      items:             TrackingOrderItem[];
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
        order_number, order_name, status, payment_status,
        fulfilment_type, total_pence, created_at,
        restaurants (
          name, slug,
          restaurant_branding ( logo_url ),
          fulfilment_settings ( pickup_prep_time_minutes, delivery_time_minutes )
        ),
        order_items ( id, name, quantity, selected_modifiers )
      `)
      .eq("tracking_token", token)
      .maybeSingle();

    if (!order) return { found: false };

    // Unwrap joined relations (Supabase may return array or object)
    const rest = Array.isArray(order.restaurants)
      ? order.restaurants[0]
      : (order.restaurants as {
          name: string;
          slug: string;
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

    return {
      found:             true,
      restaurantName:    rest.name,
      restaurantLogoUrl: branding?.logo_url ?? null,
      restaurantSlug:    rest.slug,
      orderNumber:       order.order_number,
      orderName:         order.order_name,
      status:            order.status,
      paymentStatus:     order.payment_status,
      fulfilmentType:    order.fulfilment_type,
      totalPence:        order.total_pence,
      createdAt:         order.created_at,
      estimatedMinutes,
      items,
    };
  });
