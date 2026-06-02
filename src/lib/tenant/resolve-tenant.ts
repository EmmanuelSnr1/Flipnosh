/**
 * Tenant resolver — pure functions, safe to import from both server and client.
 *
 * Rules:
 *   naturalfingers.flipnosh.com  →  "naturalfingers"
 *   burgerlab.flipnosh.com       →  "burgerlab"
 *   flipnosh.com                 →  null  (marketing)
 *   www.flipnosh.com             →  null  (marketing)
 *   app.flipnosh.com             →  null  (dashboard)
 *   flipnosh.netlify.app         →  null  (deploy preview host)
 *   localhost / localhost:3000   →  null  (local dev)
 *   127.0.0.1                    →  null  (local dev)
 */

/** Subdomain names that are NOT restaurant storefronts. */
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "mail", "cdn"]);

/**
 * Derives a restaurant subdomain from a hostname.
 * Returns the subdomain string, or `null` if the host is not a storefront.
 */
export function resolveStorefrontSubdomain(hostname: string): string | null {
  // Strip port (e.g. "localhost:3000" → "localhost")
  const host = hostname.split(":")[0];

  // Local dev hosts — never a storefront
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local")
  ) {
    return null;
  }

  // flipnosh.netlify.app (deploy preview) — treat as main domain
  if (host.endsWith(".netlify.app")) return null;

  // Require exactly *.flipnosh.com
  if (!host.endsWith(".flipnosh.com")) return null;

  const subdomain = host.slice(0, host.length - ".flipnosh.com".length);

  // Must be a single-level subdomain (no dots) and not reserved
  if (!subdomain || subdomain.includes(".") || RESERVED_SUBDOMAINS.has(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Storefront sub-paths that should be rewritten to /r/:subdomain/:sub on the
 * server, and prefixed with /r/:subdomain on the client router.
 *
 * Paths NOT in this set (e.g. /order-success, /track/*, /_server/*)
 * are served as-is regardless of the subdomain.
 */
export const STOREFRONT_SUB_PATHS = new Set([
  "/",
  "/menu",
  "/checkout",
  "/success",
  "/contact",
  "/about",
  "/offers",
]);

/**
 * Returns true when a pathname is a storefront sub-page on a restaurant
 * subdomain (and therefore needs rewriting / router-prefixing).
 */
export function isStorefrontPath(pathname: string): boolean {
  // Strip query string
  const path = pathname.split("?")[0].split("#")[0];
  // Exact match first
  if (STOREFRONT_SUB_PATHS.has(path)) return true;
  // Handle trailing slash variants
  if (path.endsWith("/") && STOREFRONT_SUB_PATHS.has(path.slice(0, -1))) return true;
  return false;
}
