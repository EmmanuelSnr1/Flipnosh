/**
 * Public URL helpers — derive canonical URLs for restaurants and order tracking.
 *
 * Priority:
 *   1. Subdomain URL   https://naturalfingers.flipnosh.com
 *   2. Path URL        https://flipnosh.com/r/naturalfingers  (fallback)
 *
 * Used by:
 *   - tracking_url generation in orders & payments
 *   - Stripe cancel_url / success_url
 *   - Dashboard storefront links
 *   - OG canonical meta tags
 *   - n8n event payloads
 */

const APP_BASE =
  (typeof process !== "undefined"
    ? process.env.VITE_APP_URL
    : undefined) ??
  (typeof import.meta !== "undefined"
    ? (import.meta.env?.VITE_APP_URL as string | undefined)
    : undefined) ??
  "https://flipnosh.com";

/**
 * Returns the canonical public URL for a restaurant storefront.
 *
 * @param subdomain  restaurants.subdomain  — e.g. "naturalfingers"
 * @param slug       restaurants.slug       — fallback identifier
 */
export function getRestaurantPublicUrl({
  subdomain,
  slug,
}: {
  subdomain?: string | null;
  slug: string;
}): string {
  if (subdomain) {
    return `https://${subdomain}.flipnosh.com`;
  }
  return `${APP_BASE}/r/${slug}`;
}

/**
 * Returns the full public tracking URL for an order.
 *
 * When a subdomain is known the tracking page is served from the restaurant's
 * own domain (naturalfingers.flipnosh.com/track/…), so the link feels branded.
 * The /track/ route is served on ALL hosts by the same TanStack Start function.
 */
export function getTrackingUrl({
  token,
  subdomain,
}: {
  token: string;
  subdomain?: string | null;
}): string {
  if (subdomain) {
    return `https://${subdomain}.flipnosh.com/track/${token}`;
  }
  return `${APP_BASE}/track/${token}`;
}
