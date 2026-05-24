/**
 * Stripe Billing — server-only.
 *
 * Import lazily inside server function handlers:
 *   const { createCheckoutSession } = await import("@/lib/stripe/billing");
 *
 * Never import at module top-level in files bundled to the client.
 */

import type Stripe from "stripe";

// ─── Config ───────────────────────────────────────────────────────────────────

export type StripePriceIds = {
  starterMonthly: string;
  growthMonthly: string;
  proMonthly: string;
};

export function getStripePriceIds(): StripePriceIds {
  return {
    starterMonthly: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    growthMonthly: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
    proMonthly: process.env.STRIPE_PRO_PRICE_ID ?? "",
  };
}

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set — add it to .env");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const StripeSDK = require("stripe") as typeof import("stripe")["default"];
  return new StripeSDK(key, { apiVersion: "2026-04-22.dahlia" as "2026-04-22.dahlia" });
}

// ─── Customer ─────────────────────────────────────────────────────────────────

/** Creates a Stripe customer for a restaurant and returns the customer ID. */
export async function createStripeCustomer(opts: {
  email: string;
  name: string;
  restaurantId: string;
}): Promise<string> {
  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.name,
    metadata: { restaurant_id: opts.restaurantId },
  });
  return customer.id;
}

// ─── Checkout session ─────────────────────────────────────────────────────────

/** Creates a Stripe Checkout session for a plan upgrade. Returns the session URL. */
export async function createCheckoutSession(opts: {
  stripeCustomerId: string;
  priceId: string;
  restaurantId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    customer: opts.stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    metadata: { restaurant_id: opts.restaurantId },
    subscription_data: {
      metadata: { restaurant_id: opts.restaurantId },
    },
  });
  return session.url ?? opts.cancelUrl;
}

// ─── Billing portal ───────────────────────────────────────────────────────────

/** Creates a Stripe Billing Portal session. Returns the portal URL. */
export async function createBillingPortalSession(opts: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: opts.stripeCustomerId,
    return_url: opts.returnUrl,
  });
  return session.url;
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

/** Verifies a Stripe webhook signature and returns the parsed event. */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
): Promise<Stripe.Event> {
  const stripe = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret)
    throw new Error("STRIPE_WEBHOOK_SECRET is not set — add it to .env");
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// ─── Plan → price ID mapping ──────────────────────────────────────────────────

export function planToPriceId(plan: string): string {
  const ids = getStripePriceIds();
  if (plan === "growth") return ids.growthMonthly;
  if (plan === "pro") return ids.proMonthly;
  return ids.starterMonthly;
}
