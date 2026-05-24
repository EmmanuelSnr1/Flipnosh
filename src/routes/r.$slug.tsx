import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getStorefrontBySlug } from "@/api/storefront";
import { adaptStorefrontToRestaurant } from "@/lib/storefront/adapter";
import { store } from "@/stores/mock-store";
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

  component: () => <Outlet />,
});
