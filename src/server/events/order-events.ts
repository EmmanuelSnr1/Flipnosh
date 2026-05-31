/**
 * Central order event emitter — SERVER ONLY.
 *
 * Called from:
 *   - src/api/orders.ts        (COD orders placed)
 *   - src/api/payments.ts      (Stripe checkout order created)
 *   - src/api/dashboard.ts     (staff status updates)
 *   - src/server/stripe/payment-webhook.ts  (payment confirmed / failed)
 *
 * For each event this function:
 *   1. Inserts a row into `restaurant_notifications` (staff inbox) —
 *      only for actionable events: new_order, order_paid, payment_failed
 *   2. Dispatches to n8n via fire-and-forget webhook (all event types)
 *
 * The entire function is best-effort and non-fatal.
 */

import { getAdminClient } from "@/lib/supabase/server";
import {
  dispatchOrderEventToN8n,
  type OrderEventType,
  type OrderEventPayload,
} from "@/lib/n8n/dispatch";

export type OrderEventInput = {
  restaurantId:   string;
  orderId:        string;
  orderNumber:    string;
  orderName:      string | null;
  customerName:   string;
  customerPhone:  string | null;
  customerEmail:  string | null;
  fulfilmentType: string;
  totalPence:     number;
  status?:        string;
  paymentStatus?: string;
  source?:        string | null;
  /** Pre-built public tracking URL (ordtrk_… token already resolved) */
  trackingUrl?:   string | null;
};

const STAFF_ALERT_TYPES: OrderEventType[] = [
  "new_order",
  "order_paid",
  "payment_failed",
];

export async function emitOrderEvent(
  type: OrderEventType,
  data: OrderEventInput,
): Promise<void> {
  try {
    // ── 1. Staff-inbox notification ──────────────────────────────────────────
    if (STAFF_ALERT_TYPES.includes(type)) {
      const amountStr = `£${(data.totalPence / 100).toFixed(2)}`;
      const fulfilStr = data.fulfilmentType === "delivery" ? "Delivery" : "Pickup";

      let title: string;
      let body: string;

      switch (type) {
        case "new_order":
          title = `New order ${data.orderNumber}`;
          body  = `${data.customerName} · ${amountStr} · ${fulfilStr}`;
          break;
        case "order_paid":
          title = `Payment confirmed — ${data.orderNumber}`;
          body  = `${data.customerName} · ${amountStr} paid · ${fulfilStr}`;
          break;
        case "payment_failed":
          title = `Payment failed — ${data.orderNumber}`;
          body  = `${data.customerName} · ${amountStr} — payment could not be processed`;
          break;
        default:
          title = `Order update — ${data.orderNumber}`;
          body  = data.customerName;
      }

      try {
        const db = getAdminClient();
        await db.from("restaurant_notifications").insert({
          restaurant_id: data.restaurantId,
          type,
          title,
          body,
          order_id: data.orderId,
          is_read:  false,
        });
      } catch {
        // Non-fatal — notification insert must not block anything
      }
    }

    // ── 2. n8n dispatch (fire-and-forget) ────────────────────────────────────
    const base =
      (typeof process !== "undefined" ? process.env.VITE_APP_URL : undefined) ??
      "http://localhost:8080";

    const payload: OrderEventPayload = {
      event_type:      type,
      restaurant_id:   data.restaurantId,
      order_id:        data.orderId,
      order_number:    data.orderNumber,
      order_name:      data.orderName,
      customer_name:   data.customerName,
      customer_phone:  data.customerPhone ?? null,
      customer_email:  data.customerEmail ?? null,
      fulfilment_type: data.fulfilmentType,
      total_pence:     data.totalPence,
      status:          data.status,
      payment_status:  data.paymentStatus,
      source:          data.source ?? null,
      timestamp:       new Date().toISOString(),
      links: {
        tracking_url:  data.trackingUrl ?? null,
        dashboard_url: `${base}/dashboard/orders?r=${data.restaurantId}`,
      },
    };

    void dispatchOrderEventToN8n(payload).catch(() => {/* swallow */});

  } catch {
    // Entire emit is best-effort — must never throw
  }
}
