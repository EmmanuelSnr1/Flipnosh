/**
 * Tenant resolver — pure functions, safe to import from both server and client.
 *
 * Production:
 *   naturalfingers.flipnosh.com  →  "naturalfingers"
 *   burgerlab.flipnosh.com       →  "burgerlab"
 *   flipnosh.com                 →  null  (marketing)
 *   www.flipnosh.com             →  null  (marketing)
 *   app.flipnosh.com             →  null  (dashboard)
 *   flipnosh.netlify.app         →  null  (deploy preview host)
 *
 * Local dev (no hosts-file / DoH-safe):
 *   naturalfingers.lvh.me:8080   →  "naturalfingers"
 *   naturalfingers.localtest.me  →  "naturalfingers"
 *   localhost / 127.0.0.1        →  null
 *
 * lvh.me and localtest.me are public wildcard-DNS services that always return
 * 127.0.0.1, so they work even when Chrome bypasses /etc/hosts via DNS-over-HTTPS.
 */

/** Subdomain names that are NOT restaurant storefronts. */
const RESERVED_SUBDOMAINS = new Set(["www", "app", "api", "mail", "cdn"]);

function extractSubdomain(host: string, suffix: string): string | null {
  const sub = host.slice(0, host.length - suffix.length);
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
  return sub;
}

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

  // Production: *.flipnosh.com
  if (host.endsWith(".flipnosh.com")) {
    return extractSubdomain(host, ".flipnosh.com");
  }

  // Local dev wildcard DNS — bypasses /etc/hosts and works with Chrome DoH:
  //   naturalfingers.lvh.me        → 127.0.0.1  (public service)
  //   naturalfingers.localtest.me  → 127.0.0.1  (public service)
  if (host.endsWith(".lvh.me")) {
    return extractSubdomain(host, ".lvh.me");
  }
  if (host.endsWith(".localtest.me")) {
    return extractSubdomain(host, ".localtest.me");
  }

  return null;
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
