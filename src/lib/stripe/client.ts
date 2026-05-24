/**
 * Stripe helpers
 *
 * TODO: Install stripe and @stripe/stripe-js, then replace stubs.
 *
 *   bun add stripe @stripe/stripe-js
 *
 * Browser-side (Stripe.js):
 *
 *   import { loadStripe } from "@stripe/stripe-js";
 *   export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
 *
 * Server-side (Node/Edge, used in src/server/):
 *
 *   import Stripe from "stripe";
 *   export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 *     apiVersion: "2024-06-20",
 *   });
 */

export const stripePromise = null as unknown as never;
