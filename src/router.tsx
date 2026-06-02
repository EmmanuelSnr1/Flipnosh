import { QueryClient } from "@tanstack/react-query";
import { createRouter, createBrowserHistory } from "@tanstack/react-router";
import type { RouterHistory, NavigateOptions } from "@tanstack/history";
import { routeTree } from "./routeTree.gen";
import { resolveStorefrontSubdomain, isStorefrontPath } from "./lib/tenant/resolve-tenant";

// Derive non-exported types from the interface itself
type SubscriberCb        = Parameters<RouterHistory["subscribe"]>[0];
type SubscriberCallbackArg = Parameters<SubscriberCb>[0];
type NotifyAction        = Parameters<RouterHistory["notify"]>[0];

// ─── Subdomain-aware history ──────────────────────────────────────────────────
//
// When the customer is on naturalfingers.flipnosh.com the browser URL looks
// like  /menu  but the TanStack route tree expects  /r/naturalfingers/menu .
//
// We wrap createBrowserHistory() so the router always sees the full
// /r/:subdomain/* path while the browser address bar shows the clean
// /:sub path.
//
// Only storefront sub-paths are prefixed; global paths like /order-success
// and /track/* pass through unchanged — matching the server-side rewrite
// logic in src/server.ts.

function createSubdomainHistory(subdomain: string): RouterHistory {
  const prefix = `/r/${subdomain}`;
  const inner  = createBrowserHistory();

  const addPrefix = (pathname: string): string => {
    if (isStorefrontPath(pathname)) {
      return prefix + (pathname === "/" ? "/" : pathname);
    }
    return pathname;
  };

  const stripPrefix = (to: string): string => {
    if (to.startsWith(prefix + "/") || to === prefix) {
      const stripped = to.slice(prefix.length);
      return stripped || "/";
    }
    return to;
  };

  return {
    get location() {
      const loc = inner.location;
      return { ...loc, pathname: addPrefix(loc.pathname) };
    },
    get length() { return inner.length; },
    subscribers: inner.subscribers as Set<SubscriberCb>,
    subscribe(cb: SubscriberCb) { return inner.subscribe(cb); },
    push(to: string, state?: unknown, navigateOpts?: NavigateOptions) {
      inner.push(stripPrefix(to), state, navigateOpts);
    },
    replace(to: string, state?: unknown, navigateOpts?: NavigateOptions) {
      inner.replace(stripPrefix(to), state, navigateOpts);
    },
    go(n: number, navigateOpts?: NavigateOptions) { inner.go(n, navigateOpts); },
    back(navigateOpts?: NavigateOptions)    { inner.back(navigateOpts); },
    forward(navigateOpts?: NavigateOptions) { inner.forward(navigateOpts); },
    canGoBack() { return inner.canGoBack(); },
    createHref(to: string) { return inner.createHref(stripPrefix(to)); },
    block: inner.block.bind(inner),
    notify(action: NotifyAction) { inner.notify(action); },
    flush()   { inner.flush(); },
    destroy() { inner.destroy(); },
  };
}

// suppress unused-type warnings for derived types
void (0 as unknown as SubscriberCallbackArg);

// ─── Router factory ───────────────────────────────────────────────────────────

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Detect restaurant subdomain on the client (safe — no-op during SSR).
  const subdomain =
    typeof window !== "undefined"
      ? resolveStorefrontSubdomain(window.location.hostname)
      : null;

  const history = subdomain
    ? createSubdomainHistory(subdomain)
    : createBrowserHistory();

  const router = createRouter({
    routeTree,
    history,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
