import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { getStorefrontBySlug } from "@/api/storefront";
import { adaptStorefrontToRestaurant } from "@/lib/storefront/adapter";
import { getRestaurantPublicUrl } from "@/lib/tenant/get-public-url";
import { store } from "@/stores/mock-store";
import { cart } from "@/stores/cart-store";
import type { Restaurant } from "@/types";

export const Route = createFileRoute("/r/$slug")({
  // ── Social / OG meta — overrides the root defaults for every storefront page ──
  head: ({ loaderData, params }) => {
    const r = loaderData?.restaurant;
    if (!r) return {};

    // Use subdomain URL as canonical so crawlers index the branded domain
    const pageUrl = getRestaurantPublicUrl({
      subdomain: (r as Restaurant & { subdomain?: string | null }).subdomain,
      slug: params.slug,
    });

    const title       = `${r.name} — Order Online`;
    const description = r.branding?.tagline?.trim()
      || r.branding?.description?.trim()
      || `Order directly from ${r.name}. Fresh food, no commission.`;

    // Only use absolute image URLs (Supabase Storage).
    // Blob: URLs are local-only previews from the onboarding flow.
    const imageUrl = [r.branding?.heroImageUrl, r.branding?.logoUrl]
      .find((u) => typeof u === "string" && u.startsWith("https://"));

    return {
      links: [
        // Canonical URL — tells search engines the subdomain is the primary URL
        { rel: "canonical", href: pageUrl },
      ],
      meta: [
        { title },
        { name: "description",            content: description },

        // Open Graph — WhatsApp, Facebook, iMessage, Slack, etc.
        { property: "og:type",            content: "website" },
        { property: "og:url",             content: pageUrl },
        { property: "og:site_name",       content: "FlipNosh" },
        { property: "og:title",           content: title },
        { property: "og:description",     content: description },
        ...(imageUrl
          ? [
              { property: "og:image",       content: imageUrl },
              { property: "og:image:alt",   content: r.name },
              { property: "og:image:width", content: "1200" },
            ]
          : []),

        // Twitter / X card
        {
          name: "twitter:card",
          content: imageUrl ? "summary_large_image" : "summary",
        },
        { name: "twitter:title",          content: title },
        { name: "twitter:description",    content: description },
        ...(imageUrl
          ? [{ name: "twitter:image", content: imageUrl }]
          : []),
      ],
    };
  },

  loader: async ({ params }): Promise<{ restaurant: Restaurant }> => {
    // ── 1. Try real data from Supabase ────────────────────────────────────
    const supabaseData = await getStorefrontBySlug({ data: params.slug }).catch(
      (err: unknown) => {
        console.warn(
          `[storefront] Supabase load failed for "${params.slug}", falling back to mock:`,
          err,
        );
        return null;
      },
    );

    if (supabaseData) {
      return { restaurant: adaptStorefrontToRestaurant(supabaseData) };
    }

    // ── 2. Mock fallback ──────────────────────────────────────────────────
    const mockRestaurant = store.getRestaurant(params.slug);
    if (mockRestaurant) {
      return { restaurant: mockRestaurant };
    }

    // ── 3. Nothing found ──────────────────────────────────────────────────
    throw notFound();
  },

  component: StorefrontShell,
});

/**
 * Thin wrapper that captures the ?src= QR attribution key from the URL and
 * stores it in the cart so it can be included when the customer checks out.
 *
 * We read directly from window.location.search (not from TanStack Router's
 * search type system) to avoid forcing all <Link to="/r/$slug"> callers to
 * pass an explicit `search` prop.
 */
function StorefrontShell() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const src = new URLSearchParams(window.location.search).get("src");
    cart.setSource(src);
  }, []); // Capture once on mount — the URL doesn't change while the storefront is loaded

  return <Outlet />;
}
