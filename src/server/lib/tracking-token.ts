/**
 * Order tracking token generator — SERVER ONLY.
 *
 * Produces a random, unguessable, URL-safe token of the form:
 *   ordtrk_<22 base64url chars>
 *
 * 128 bits of randomness → effectively impossible to guess.
 * Does NOT expose the order id or any internal data.
 */
import { randomBytes } from "node:crypto";

export function generateTrackingToken(): string {
  return `ordtrk_${randomBytes(16).toString("base64url")}`;
}

/**
 * Builds the full public tracking URL from a token.
 *
 * When the restaurant has a subdomain the link is branded:
 *   https://naturalfingers.flipnosh.com/track/ordtrk_…
 *
 * Fallback (no subdomain or dev):
 *   https://flipnosh.com/track/ordtrk_…  (or localhost:8080 in dev)
 */
export function buildTrackingUrl(token: string, subdomain?: string | null): string {
  if (subdomain) {
    return `https://${subdomain}.flipnosh.com/track/${token}`;
  }
  const base =
    (typeof process !== "undefined"
      ? process.env.VITE_APP_URL
      : undefined) ??
    "http://localhost:8080";
  return `${base}/track/${token}`;
}
