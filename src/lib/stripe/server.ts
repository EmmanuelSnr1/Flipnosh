/**
 * Server-only Stripe helper.
 *
 * NEVER import this file from client-side code — STRIPE_SECRET_KEY has no
 * VITE_ prefix and is intentionally not inlined by Vite into the browser bundle.
 *
 * Usage (inside createServerFn handlers):
 *   const { getStripe } = await import("@/lib/stripe/server");
 *   const stripe = getStripe();
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Returns a singleton Stripe client initialised with STRIPE_SECRET_KEY.
 * Throws clearly if the env var is missing so misconfiguration is caught early.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key =
    (typeof process !== "undefined" ? process.env.STRIPE_SECRET_KEY : undefined) ?? "";

  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — add it to .env (server-only, no VITE_ prefix)",
    );
  }

  _stripe = new Stripe(key, {
    // Pin to the API version bundled with Stripe SDK v22.x
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });

  return _stripe;
}
