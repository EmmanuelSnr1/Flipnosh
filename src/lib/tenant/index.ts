/**
 * Tenant utilities
 *
 * This module resolves which restaurant (tenant) the current request belongs to.
 * Slug-based routing is already implemented in /r/:slug routes; this is the place
 * to add any cross-cutting tenant logic (e.g. subdomain mapping, feature flags).
 */

/**
 * Derive a restaurant slug from a hostname.
 * e.g. "natural-fingers.flipnosh.com" → "natural-fingers"
 * Falls back to undefined for the main domain.
 */
export function slugFromHostname(hostname: string): string | undefined {
  const parts = hostname.split(".");
  // e.g. <slug>.flipnosh.com  (3 parts)
  if (parts.length >= 3) return parts[0];
  return undefined;
}
