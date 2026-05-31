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
 * import-protection plugin for files in server/ directories.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database } from "@/types/supabase";

type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];

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
  .inputValidator(
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

    // Create restaurant — retry up to 4 times on slug collisions (23505).
    // On each retry we append a random 4-digit suffix so "burgerbar" becomes
    // "burgerbar-4271", keeping the slug both readable and unique.
    let restaurant: RestaurantRow | null = null;
    let lastErrMsg = "Could not create restaurant — slug already taken";

    for (let attempt = 0; attempt < 4; attempt++) {
      const suffix = attempt === 0
        ? ""
        : `-${Math.floor(1000 + Math.random() * 9000)}`;
      const attemptSlug = `${data.slug.slice(0, 24)}${suffix}`;

      const { data: row, error: rErr } = await admin
        .from("restaurants")
        .insert({
          name: data.restaurantName,
          slug: attemptSlug,
          subdomain: attemptSlug,
          status: "draft",
          onboarding_step: "restaurant-info",
        })
        .select()
        .single();

      if (!rErr) {
        restaurant = row;
        break;
      }
      // Only retry on unique-constraint violations; surface other errors immediately
      if (rErr.code !== "23505") throw new Error(rErr.message);
      lastErrMsg = rErr.message;
    }

    if (!restaurant) throw new Error(lastErrMsg);

    // Link user as owner
    const { error: uErr } = await admin.from("restaurant_users").insert({
      restaurant_id: restaurant.id,
      user_id: data.userId,
      role: "owner",
    });
    if (uErr) throw new Error(uErr.message);

    // 30-day Starter trial — no card required
    const trialEndsAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Seed default config records
    await Promise.all([
      admin.from("restaurant_branding").insert({ restaurant_id: restaurant.id }),
      admin.from("restaurant_theme_configs").insert({ restaurant_id: restaurant.id }),
      admin.from("fulfilment_settings").insert({ restaurant_id: restaurant.id }),
      admin.from("platform_subscriptions").insert({
        restaurant_id: restaurant.id,
        plan: "starter",
        status: "trialing",
        trial_ends_at: trialEndsAt,
        billing_cycle: "monthly",
      }),
    ]);

    return restaurant;
  });
