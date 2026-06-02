import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseStorefront } from "@/lib/storefront/adapter";

// ─── Shared query helper ──────────────────────────────────────────────────────

const STOREFRONT_SELECT = `
  *,
  restaurant_branding (*),
  restaurant_theme_configs (*),
  fulfilment_settings (*),
  menus (
    *,
    menu_categories (
      *,
      menu_items (
        *,
        modifier_groups (
          *,
          modifiers (*)
        )
      )
    )
  )
` as const;

function flattenStorefront(data: Record<string, unknown>): SupabaseStorefront {
  const restaurant = {
    ...data,
    branding: Array.isArray(data.restaurant_branding)
      ? (data.restaurant_branding as unknown[])[0] ?? null
      : data.restaurant_branding,
    theme: Array.isArray(data.restaurant_theme_configs)
      ? (data.restaurant_theme_configs as unknown[])[0] ?? null
      : data.restaurant_theme_configs,
    fulfilment: Array.isArray(data.fulfilment_settings)
      ? (data.fulfilment_settings as unknown[])[0] ?? null
      : data.fulfilment_settings,
    menus: ((data.menus ?? []) as Array<Record<string, unknown>>).map((menu) => ({
      ...menu,
      menu_categories: [...((menu.menu_categories ?? []) as Array<Record<string, unknown>>)]
        .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
        .map((cat) => ({
          ...cat,
          menu_items: [...((cat.menu_items ?? []) as Array<Record<string, unknown>>)]
            .filter((item) => item.is_available)
            .sort((a, b) => (a.sort_order as number) - (b.sort_order as number)),
        })),
    })),
  };
  return restaurant as unknown as SupabaseStorefront;
}

/**
 * Full storefront payload — everything the public menu page needs in one query.
 * Returned shape mirrors what the mock store produces so routes can switch with
 * minimal changes.
 *
 * Supabase client is imported lazily inside the handler so this file remains
 * safe to import from client-side route loaders (TanStack Start import-protection
 * only checks top-level imports for the server/ directory pattern).
 */
export const getStorefrontBySlug = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }) => {
    const { getServerClient } = await import("@/lib/supabase/server");
    const db = getServerClient();

    const { data, error } = await db
      .from("restaurants")
      .select(STOREFRONT_SELECT)
      .eq("slug", slug)
      .single();

    if (error) throw new Error(`Storefront not found for slug: ${slug}`);
    return flattenStorefront(data as unknown as Record<string, unknown>);
  });

// ─── getStorefrontBySubdomain ─────────────────────────────────────────────────
// Used by the subdomain storefront route — looks up by restaurants.subdomain
// instead of restaurants.slug so the two identifiers stay independent.

export const getStorefrontBySubdomain = createServerFn({ method: "GET" })
  .inputValidator((subdomain: string) => z.string().min(1).parse(subdomain))
  .handler(async ({ data: subdomain }) => {
    const { getServerClient } = await import("@/lib/supabase/server");
    const db = getServerClient();

    const { data, error } = await db
      .from("restaurants")
      .select(STOREFRONT_SELECT)
      .eq("subdomain", subdomain)
      .single();

    if (error) throw new Error(`Storefront not found for subdomain: ${subdomain}`);
    return flattenStorefront(data as unknown as Record<string, unknown>);
  });
