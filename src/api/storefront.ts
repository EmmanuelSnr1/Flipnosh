import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Full storefront payload — everything the public menu page needs in one query.
 * Returned shape mirrors what the mock store produces so routes can switch with
 * minimal changes.
 *
 * Supabase client is imported lazily inside the handler so this file remains
 * safe to import from client-side route loaders (TanStack Start import-protection
 * only checks top-level imports for the **/server/** pattern).
 */
export const getStorefrontBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }) => {
    const { getServerClient } = await import("@/lib/supabase/server");
    const db = getServerClient();

    const { data, error } = await db
      .from("restaurants")
      .select(
        `
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
      `,
      )
      .eq("slug", slug)
      .single();

    if (error) throw new Error(`Storefront not found for slug: ${slug}`);

    // Flatten the one-to-one relations Supabase returns as arrays
    const restaurant = {
      ...data,
      branding: Array.isArray(data.restaurant_branding)
        ? data.restaurant_branding[0] ?? null
        : data.restaurant_branding,
      theme: Array.isArray(data.restaurant_theme_configs)
        ? data.restaurant_theme_configs[0] ?? null
        : data.restaurant_theme_configs,
      fulfilment: Array.isArray(data.fulfilment_settings)
        ? data.fulfilment_settings[0] ?? null
        : data.fulfilment_settings,
      // Sort categories and items by sort_order
      menus: (data.menus ?? []).map((menu) => ({
        ...menu,
        menu_categories: [...(menu.menu_categories ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((cat) => ({
            ...cat,
            menu_items: [...(cat.menu_items ?? [])]
              .filter((item) => item.is_available)
              .sort((a, b) => a.sort_order - b.sort_order),
          })),
      })),
    };

    return restaurant;
  });
