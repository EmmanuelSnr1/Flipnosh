/**
 * Auth server functions
 *
 * Sign-up and login are done client-side via supabase.auth.* (browser handles
 * the session cookie automatically).
 *
 * Server-side we expose:
 *   - getCurrentUser()              — read the session on the server
 *   - requireAuth()                 — throws if no session
 *   - signUpAndCreateRestaurant()   — creates the DB restaurant record after signup
 *
 * Supabase client imports are lazy (inside handlers) so this file is safe to
 * import from client-side route files without triggering the TanStack Start
 * import-protection plugin for **/server/** paths.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── getCurrentUser ───────────────────────────────────────────────────────────

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getServerClient } = await import("@/lib/supabase/server");
    const db = getServerClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    return user ?? null;
  },
);

// ─── requireAuth ──────────────────────────────────────────────────────────────

export const requireAuth = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getServerClient } = await import("@/lib/supabase/server");
    const db = getServerClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new Error("Unauthenticated");
    return user;
  },
);

// ─── signUpAndCreateRestaurant ────────────────────────────────────────────────
// Called after a successful client-side signup to create the initial restaurant
// record and link it to the new user as owner.

export const signUpAndCreateRestaurant = createServerFn({ method: "POST" })
  .validator(
    (input: {
      userId: string;
      restaurantName: string;
      slug: string;
    }) =>
      z
        .object({
          userId: z.string().uuid(),
          restaurantName: z.string().min(1),
          slug: z
            .string()
            .min(1)
            .regex(/^[a-z0-9-]+$/),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const admin = getAdminClient();

    // Create restaurant
    const { data: restaurant, error: rErr } = await admin
      .from("restaurants")
      .insert({
        name: data.restaurantName,
        slug: data.slug,
        subdomain: data.slug,
        status: "draft",
        onboarding_step: "restaurant-info",
      })
      .select()
      .single();

    if (rErr) throw new Error(rErr.message);

    // Link user as owner
    const { error: uErr } = await admin.from("restaurant_users").insert({
      restaurant_id: restaurant.id,
      user_id: data.userId,
      role: "owner",
    });
    if (uErr) throw new Error(uErr.message);

    // Seed default config records
    await Promise.all([
      admin.from("restaurant_branding").insert({ restaurant_id: restaurant.id }),
      admin.from("restaurant_theme_configs").insert({ restaurant_id: restaurant.id }),
      admin.from("fulfilment_settings").insert({ restaurant_id: restaurant.id }),
      admin.from("platform_subscriptions").insert({
        restaurant_id: restaurant.id,
        plan: "pilot",
        status: "trialing",
      }),
    ]);

    return restaurant;
  });
