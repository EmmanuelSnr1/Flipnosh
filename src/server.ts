import "./lib/utils/error-capture";

import { consumeLastCapturedError } from "./lib/utils/error-capture";
import { renderErrorPage } from "./lib/utils/error-page";
import { resolveStorefrontSubdomain, isStorefrontPath } from "./lib/tenant/resolve-tenant";
import {
  handleStripeConnectWebhook,
  STRIPE_CONNECT_WEBHOOK_PATH,
} from "./server/stripe/connect-webhook";
import {
  handleStripePaymentWebhook,
  STRIPE_PAYMENT_WEBHOOK_PATH,
} from "./server/stripe/payment-webhook";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    const { pathname } = url;

    // ── Intercept raw HTTP routes BEFORE TanStack Start processes them ────────
    // These need the raw request body (e.g. for Stripe signature verification)
    // and must not go through the SSR render pipeline.
    if (pathname === STRIPE_CONNECT_WEBHOOK_PATH) {
      return handleStripeConnectWebhook(request);
    }

    if (pathname === STRIPE_PAYMENT_WEBHOOK_PATH) {
      return handleStripePaymentWebhook(request);
    }

    // ── Subdomain storefront rewrite ──────────────────────────────────────────
    //
    // naturalfingers.flipnosh.com/menu
    //   → served as if the URL is /r/naturalfingers/menu
    //
    // This runs BEFORE TanStack Start's SSR handler so the server-side router
    // sees the full /r/:subdomain/:sub path and renders the correct route.
    //
    // The client-side router mirrors this via the custom subdomain history in
    // src/router.tsx, so SSR → hydration is always consistent.
    //
    // Only storefront sub-paths are rewritten; shared paths like /order-success
    // and /track/* are served as-is on any host.
    const subdomain = resolveStorefrontSubdomain(url.hostname);
    let effectiveRequest = request;

    if (subdomain && isStorefrontPath(pathname)) {
      // Build rewritten path: /menu → /r/naturalfingers/menu
      const rewrittenPath =
        pathname === "/" || pathname === ""
          ? `/r/${subdomain}/`
          : `/r/${subdomain}${pathname}`;

      const rewrittenUrl = new URL(url.toString());
      rewrittenUrl.pathname = rewrittenPath;

      effectiveRequest = new Request(rewrittenUrl.toString(), {
        method:  request.method,
        headers: request.headers,
        body:    request.method === "GET" || request.method === "HEAD" ? null : request.body,
        // @ts-expect-error — duplex is needed for streaming bodies in some runtimes
        duplex:  "half",
      });
    }

    // ── Normal TanStack Start SSR handler ─────────────────────────────────────
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(effectiveRequest, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
