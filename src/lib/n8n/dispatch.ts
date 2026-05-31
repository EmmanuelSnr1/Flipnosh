/**
 * Fire-and-forget n8n webhook dispatcher.
 *
 * SERVER-SIDE ONLY — never import this directly in client code.
 * Requires env vars (no VITE_ prefix — never bundled into client):
 *   N8N_ORDER_EVENTS_WEBHOOK_URL — the n8n webhook endpoint
 *   N8N_WEBHOOK_SECRET           — used to sign the payload (HMAC-SHA256)
 *
 * All calls are best-effort: a 3-second timeout is applied and all errors
 * are swallowed.  This must never block or break the order flow.
 */

export type OrderEventType =
  | "new_order"
  | "order_paid"
  | "order_status"
  | "payment_failed";

export type OrderEventPayload = {
  event_type:      OrderEventType;
  restaurant_id:   string;
  order_id:        string;
  order_number:    string;
  order_name:      string | null;
  customer_name:   string;
  customer_phone:  string | null;
  customer_email:  string | null;
  fulfilment_type: string;
  total_pence:     number;
  status?:         string;
  payment_status?: string;
  source?:         string | null;
  timestamp:       string;
  /** Public links — tracking page for customer, orders dashboard for staff */
  links?: {
    tracking_url:  string | null;
    dashboard_url: string | null;
  };
};

export async function dispatchOrderEventToN8n(
  payload: OrderEventPayload,
): Promise<void> {
  const webhookUrl =
    typeof process !== "undefined"
      ? process.env.N8N_ORDER_EVENTS_WEBHOOK_URL
      : undefined;

  if (!webhookUrl) return; // Not configured — silently skip

  const webhookSecret =
    typeof process !== "undefined"
      ? process.env.N8N_WEBHOOK_SECRET
      : undefined;

  const body = JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (webhookSecret) {
    // ── Static secret header — used by n8n "Header Auth" credential ──────────
    // n8n Webhook node → Authentication → "Header Auth"
    //   Name:  X-FlipNosh-Secret
    //   Value: <your N8N_WEBHOOK_SECRET value>
    headers["X-FlipNosh-Secret"] = webhookSecret;

    // ── HMAC-SHA256 signature — for manual verification in a Code node ────────
    try {
      const { createHmac } = await import("node:crypto");
      const sig = createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      headers["X-FlipNosh-Signature"] = `sha256=${sig}`;
    } catch {
      // crypto unavailable — skip signature
    }
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3_000);
    await fetch(webhookUrl, {
      method:  "POST",
      headers,
      body,
      signal:  controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // Fire-and-forget — swallow all network / timeout errors
  }
}
