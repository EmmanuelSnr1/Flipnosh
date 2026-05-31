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

/** Builds the full public tracking URL from a token */
export function buildTrackingUrl(token: string): string {
  const base =
    (typeof process !== "undefined" ? process.env.VITE_APP_URL : undefined) ??
    "http://localhost:8080";
  return `${base}/track/${token}`;
}
