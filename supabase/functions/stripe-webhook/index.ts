/**
 * Stripe Webhook — Supabase Edge Function
 *
 * Deploy:  supabase functions deploy stripe-webhook
 * Secrets: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
 *          supabase secrets set STRIPE_SECRET_KEY=sk_live_...
 *
 * In Stripe Dashboard, set the webhook endpoint to:
 *   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 *
 * Events to subscribe:
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_failed
 *   - invoice.payment_succeeded
 */

import Stripe from "https://esm.sh/stripe@15?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-05-28.basil" as "2025-05-28.basil",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  console.log(`[stripe-webhook] Received: ${event.type}`, { id: event.id });

  try {
    switch (event.type) {
      // ── Subscription created ──────────────────────────────────────────────
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const restaurantId = sub.metadata?.restaurant_id;
        if (!restaurantId) break;

        const priceId = sub.items.data[0]?.price?.id ?? "";
        const plan = priceIdToPlan(priceId);

        await db.from("platform_subscriptions").upsert(
          {
            restaurant_id: restaurantId,
            plan,
            status: sub.status,
            stripe_subscription_id: sub.id,
            stripe_customer_id:
              typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            stripe_price_id: priceId,
            current_period_start: new Date(
              sub.current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              sub.current_period_end * 1000,
            ).toISOString(),
            billing_cycle: sub.items.data[0]?.price?.recurring?.interval === "year"
              ? "yearly"
              : "monthly",
            cancel_at_period_end: sub.cancel_at_period_end,
          },
          { onConflict: "restaurant_id" },
        );
        break;
      }

      // ── Subscription updated ──────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const restaurantId = sub.metadata?.restaurant_id;
        if (!restaurantId) break;

        const priceId = sub.items.data[0]?.price?.id ?? "";
        const plan = priceIdToPlan(priceId);

        await db
          .from("platform_subscriptions")
          .update({
            plan,
            status: sub.status,
            stripe_price_id: priceId,
            current_period_start: new Date(
              sub.current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              sub.current_period_end * 1000,
            ).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
          })
          .eq("restaurant_id", restaurantId);
        break;
      }

      // ── Subscription deleted / cancelled ──────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const restaurantId = sub.metadata?.restaurant_id;
        if (!restaurantId) break;

        await db
          .from("platform_subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
          })
          .eq("restaurant_id", restaurantId);
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const sub =
          typeof invoice.subscription === "string"
            ? await stripe.subscriptions.retrieve(invoice.subscription)
            : invoice.subscription;

        if (!sub) break;
        const restaurantId = (sub as Stripe.Subscription).metadata
          ?.restaurant_id;
        if (!restaurantId) break;

        await db
          .from("platform_subscriptions")
          .update({ status: "past_due" })
          .eq("restaurant_id", restaurantId);

        // TODO: send payment-failed email via Resend/n8n
        console.warn(`[stripe-webhook] Payment failed for restaurant ${restaurantId}`);
        break;
      }

      // ── Payment succeeded ─────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const sub =
          typeof invoice.subscription === "string"
            ? await stripe.subscriptions.retrieve(invoice.subscription)
            : invoice.subscription;

        if (!sub) break;
        const restaurantId = (sub as Stripe.Subscription).metadata
          ?.restaurant_id;
        if (!restaurantId) break;

        await db
          .from("platform_subscriptions")
          .update({
            status: "active",
            current_period_end: new Date(
              (sub as Stripe.Subscription).current_period_end * 1000,
            ).toISOString(),
          })
          .eq("restaurant_id", restaurantId);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    // Return 200 to avoid Stripe retrying — log the error for investigation
    return new Response(JSON.stringify({ received: true, error: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Map a Stripe price ID back to our plan slug.
 * Falls back to "starter" for unknown price IDs.
 */
function priceIdToPlan(priceId: string): string {
  const growthId = Deno.env.get("STRIPE_GROWTH_PRICE_ID") ?? "";
  const proId = Deno.env.get("STRIPE_PRO_PRICE_ID") ?? "";
  if (priceId && priceId === growthId) return "growth";
  if (priceId && priceId === proId) return "pro";
  return "starter";
}
