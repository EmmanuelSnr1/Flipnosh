/**
 * Stripe payment webhook handler.
 *
 * Invoked from src/server.ts for POST requests to
 * /api/stripe/payment-webhook before they reach TanStack Start,
 * so we have access to the raw request body needed for signature verification.
 *
 * Handles:
 *   checkout.session.completed   — marks order paid
 *   checkout.session.expired     — marks order cancelled (payment)
 *   payment_intent.payment_failed — marks order failed (payment)
 */

/** Public path that Stripe should be configured to POST to. */
export const STRIPE_PAYMENT_WEBHOOK_PATH = "/api/stripe/payment-webhook";

export async function handleStripePaymentWebhook(request: Request): Promise<Response> {
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  // ── Only accept POST ──────────────────────────────────────────────────────
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return json({ error: "Missing stripe-signature header" }, 400);
  }

  const webhookSecret =
    (typeof process !== "undefined"
      ? process.env.STRIPE_PAYMENT_WEBHOOK_SECRET
      : undefined) ?? "";

  if (!webhookSecret) {
    console.error("[payment-webhook] STRIPE_PAYMENT_WEBHOOK_SECRET is not set");
    return json({ error: "Webhook secret not configured" }, 500);
  }

  // ── Read raw body (must not be parsed before signature verification) ──────
  const rawBody = await request.text();

  // ── Verify signature and construct event ─────────────────────────────────
  type StripeEvent = {
    type: string;
    data: { object: Record<string, unknown> };
    account?: string;
  };
  let event: StripeEvent;

  try {
    const { getStripe } = await import("@/lib/stripe/server");
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret) as unknown as StripeEvent;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.warn("[payment-webhook] Signature error:", msg);
    return json({ error: `Webhook signature verification failed: ${msg}` }, 400);
  }

  // ── Dispatch by event type ────────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      // payment_intent.succeeded is covered by checkout.session.completed
      // in the destination charge model — no separate handler needed
      default:
        // Unhandled event type — log and return 200 so Stripe doesn't retry
        console.log("[payment-webhook] Unhandled event type:", event.type);
    }
  } catch (err) {
    // Log but always return 200 so Stripe doesn't retry indefinitely
    console.error("[payment-webhook] Handler error for", event.type, err);
  }

  return json({ received: true });
}

// ── checkout.session.completed ────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  session: Record<string, unknown>,
): Promise<void> {
  const sessionId = session.id as string | undefined;
  const metadata  = session.metadata as Record<string, string> | undefined;
  const orderId   = metadata?.order_id;

  if (!sessionId || !orderId) {
    console.warn("[payment-webhook] checkout.session.completed: missing session id or order_id metadata");
    return;
  }

  // payment_intent may be a string id or an expanded object
  const piRaw = session.payment_intent;
  const paymentIntentId: string | null =
    typeof piRaw === "string"
      ? piRaw
      : typeof piRaw === "object" && piRaw !== null
        ? ((piRaw as Record<string, unknown>).id as string)
        : null;

  const { getAdminClient } = await import("@/lib/supabase/server");
  const db = getAdminClient();

  // ── Idempotency check — skip if already marked paid ──────────────────────
  const { data: existing } = await db
    .from("orders")
    .select("id, status, payment_status, order_number, order_name, total_pence, restaurant_id, fulfilment_type, customer_name, customer_phone, customer_email, source")
    .eq("id", orderId)
    .maybeSingle();

  if (!existing) {
    console.warn("[payment-webhook] checkout.session.completed: order not found:", orderId);
    return;
  }

  if (existing.payment_status === "paid") {
    // Already processed — webhook is a duplicate (Stripe may retry)
    console.log("[payment-webhook] checkout.session.completed: already paid, skipping:", orderId);
    return;
  }

  // ── Update order to paid ──────────────────────────────────────────────────
  const { error } = await db
    .from("orders")
    .update({
      payment_status:           "paid",
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id:  paymentIntentId,
      paid_at:                   new Date().toISOString(),
      // Also move operational status from 'pending' to 'accepted' automatically
      // when payment is confirmed — restaurants don't need to manually accept paid orders.
      status: existing.status === "pending" ? "accepted" : undefined,
    })
    .eq("id", orderId);

  if (error) {
    console.error("[payment-webhook] Failed to update order to paid:", error.message);
    throw error; // Cause 500 so Stripe retries
  }

  console.log(
    `[payment-webhook] checkout.session.completed → order ${existing.order_number} marked paid`,
  );

  // ── Emit order_paid event → staff notification + n8n dispatch ─────────────
  try {
    const { emitOrderEvent } = await import("@/server/events/order-events");
    await emitOrderEvent("order_paid", {
      restaurantId:   existing.restaurant_id,
      orderId,
      orderNumber:    existing.order_number,
      orderName:      (existing as Record<string, unknown>).order_name as string | null ?? null,
      customerName:   (existing as Record<string, unknown>).customer_name as string ?? "",
      customerPhone:  (existing as Record<string, unknown>).customer_phone as string | null ?? null,
      customerEmail:  (existing as Record<string, unknown>).customer_email as string | null ?? null,
      fulfilmentType: existing.fulfilment_type,
      totalPence:     existing.total_pence,
      status:         "accepted",
      paymentStatus:  "paid",
      source:         (existing as Record<string, unknown>).source as string | null ?? null,
    });
  } catch {
    // Non-fatal — event dispatch must not block payment confirmation
  }
}

// ── checkout.session.expired ──────────────────────────────────────────────────

async function handleCheckoutSessionExpired(
  session: Record<string, unknown>,
): Promise<void> {
  const sessionId = session.id as string | undefined;
  const metadata  = session.metadata as Record<string, string> | undefined;
  const orderId   = metadata?.order_id;

  if (!orderId) return;

  const { getAdminClient } = await import("@/lib/supabase/server");
  const db = getAdminClient();

  // Only update if still pending — don't override paid status
  const { error } = await db
    .from("orders")
    .update({ payment_status: "cancelled" })
    .eq("id", orderId)
    .in("payment_status", ["pending"]);

  if (error) {
    console.error("[payment-webhook] Failed to mark order cancelled:", error.message);
  } else {
    console.log(`[payment-webhook] checkout.session.expired → order ${orderId} cancelled`);
    void sessionId; // referenced to avoid lint warning
  }
}

// ── payment_intent.payment_failed ─────────────────────────────────────────────

async function handlePaymentIntentFailed(
  paymentIntent: Record<string, unknown>,
): Promise<void> {
  const piId    = paymentIntent.id as string | undefined;
  const reason  = (paymentIntent.last_payment_error as Record<string, unknown> | undefined)
    ?.message as string | undefined;

  if (!piId) return;

  const { getAdminClient } = await import("@/lib/supabase/server");
  const db = getAdminClient();

  // Find order by stripe_payment_intent_id (may or may not be set yet)
  const { data: order } = await db
    .from("orders")
    .select("id, payment_status")
    .eq("stripe_payment_intent_id", piId)
    .maybeSingle();

  if (!order) {
    // payment_intent.payment_failed can fire before we save the intent id —
    // no action needed; checkout.session.expired will handle cleanup.
    return;
  }

  if (order.payment_status === "paid") return; // Already paid — ignore

  const { error } = await db
    .from("orders")
    .update({
      payment_status:          "failed",
      payment_failure_reason:  reason ?? "Payment failed",
    })
    .eq("id", order.id);

  if (error) {
    console.error("[payment-webhook] Failed to mark order failed:", error.message);
    return;
  }

  console.log(`[payment-webhook] payment_intent.payment_failed → order ${order.id} failed`);

  // ── Emit payment_failed event → staff notification + n8n dispatch ──────────
  try {
    const { data: orderDetails } = await db
      .from("orders")
      .select("order_number, order_name, customer_name, customer_phone, customer_email, fulfilment_type, total_pence, restaurant_id, source")
      .eq("id", order.id)
      .maybeSingle();

    if (orderDetails) {
      const { emitOrderEvent } = await import("@/server/events/order-events");
      await emitOrderEvent("payment_failed", {
        restaurantId:   orderDetails.restaurant_id,
        orderId:        order.id,
        orderNumber:    orderDetails.order_number,
        orderName:      (orderDetails as Record<string, unknown>).order_name as string | null ?? null,
        customerName:   orderDetails.customer_name,
        customerPhone:  orderDetails.customer_phone,
        customerEmail:  orderDetails.customer_email,
        fulfilmentType: orderDetails.fulfilment_type,
        totalPence:     orderDetails.total_pence,
        status:         "pending",
        paymentStatus:  "failed",
        source:         (orderDetails as Record<string, unknown>).source as string | null ?? null,
      });
    }
  } catch {
    // Non-fatal
  }
}
