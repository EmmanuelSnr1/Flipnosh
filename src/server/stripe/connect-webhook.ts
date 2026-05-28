/**
 * Stripe Connect webhook handler.
 *
 * Invoked from src/server.ts for POST requests to
 * /api/stripe/connect-webhook before they reach TanStack Start,
 * so we have access to the raw request body needed for signature verification.
 *
 * Handles:
 *   account.updated — syncs Stripe account status flags to the restaurants row
 */

/** Public path that Stripe should be configured to POST to. */
export const STRIPE_CONNECT_WEBHOOK_PATH = "/api/stripe/connect-webhook";

export async function handleStripeConnectWebhook(request: Request): Promise<Response> {
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
      ? process.env.STRIPE_CONNECT_WEBHOOK_SECRET
      : undefined) ?? "";

  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_CONNECT_WEBHOOK_SECRET is not set");
    return json({ error: "Webhook secret not configured" }, 500);
  }

  // ── Read raw body (must not be parsed before signature verification) ──────
  const rawBody = await request.text();

  // ── Verify signature and construct event ─────────────────────────────────
  let event: { type: string; data: { object: Record<string, unknown> }; account?: string };

  try {
    const { getStripe } = await import("@/lib/stripe/server");
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret) as typeof event;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature verification failed";
    console.warn("[stripe-webhook] Signature error:", msg);
    return json({ error: `Webhook signature verification failed: ${msg}` }, 400);
  }

  // ── Dispatch by event type ────────────────────────────────────────────────
  try {
    if (event.type === "account.updated") {
      await handleAccountUpdated(event.data.object);
    }
    // Future events can be added here (e.g. account.application.deauthorized)
  } catch (err) {
    // Log but always return 200 so Stripe doesn't retry indefinitely
    console.error("[stripe-webhook] Handler error for", event.type, err);
  }

  return json({ received: true });
}

// ── Event handler: account.updated ───────────────────────────────────────────

async function handleAccountUpdated(account: Record<string, unknown>): Promise<void> {
  const accountId = account.id as string | undefined;
  if (!accountId) {
    console.warn("[stripe-webhook] account.updated: missing account id");
    return;
  }

  const chargesEnabled   = (account.charges_enabled   as boolean | undefined) ?? false;
  const payoutsEnabled   = (account.payouts_enabled   as boolean | undefined) ?? false;
  const detailsSubmitted = (account.details_submitted as boolean | undefined) ?? false;

  const { getAdminClient } = await import("@/lib/supabase/server");
  const db = getAdminClient();

  const { error, count } = await db
    .from("restaurants")
    .update({
      stripe_charges_enabled:    chargesEnabled,
      stripe_payouts_enabled:    payoutsEnabled,
      stripe_details_submitted:  detailsSubmitted,
      stripe_onboarding_complete: chargesEnabled && payoutsEnabled,
    })
    .eq("stripe_account_id", accountId)
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[stripe-webhook] DB update error:", error.message);
  } else if (!count) {
    // No restaurant found — might be a test account or already deleted
    console.warn("[stripe-webhook] No restaurant found for Stripe account:", accountId);
  } else {
    console.log(
      `[stripe-webhook] account.updated → restaurant updated (charges=${chargesEnabled}, payouts=${payoutsEnabled})`,
    );
  }
}
