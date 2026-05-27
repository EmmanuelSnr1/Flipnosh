import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { getStorefrontBySlug } from "@/api/storefront";
import { adaptStorefrontToRestaurant } from "@/lib/storefront/adapter";
import { store } from "@/stores/mock-store";
import { cart } from "@/stores/cart-store";
import type { Restaurant } from "@/types";

export const Route = createFileRoute("/r/$slug")({
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
