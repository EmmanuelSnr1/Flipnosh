import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAdminClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

// ─── getRestaurantBySlug ──────────────────────────────────────────────────────

export const getRestaurantBySlug = createServerFn({ method: "GET" })
  .validator((slug: string) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw new Error(`Restaurant not found: ${slug}`);
    return data;
  });

// ─── getCurrentUserRestaurants ────────────────────────────────────────────────

export const getCurrentUserRestaurants = createServerFn({ method: "GET" })
  .handler(async () => {
    const db = getServerClient();

    const {
      data: { user },
    } = await db.auth.getUser();

    if (!user) return [];

    const { data, error } = await db
      .from("restaurant_users")
      .select("role, restaurants(*)")
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    return (data ?? []).map((row) => ({
      role: row.role,
      restaurant: row.restaurants,
    }));
  });

// ─── createRestaurant ─────────────────────────────────────────────────────────

const CreateRestaurantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers and hyphens"),
  subdomain: z.string().min(1),
  city: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  cuisine_type: z.string().optional(),
});

export const createRestaurant = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof CreateRestaurantSchema>) =>
    CreateRestaurantSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const db = getServerClient();

    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Use admin client to create restaurant + owner record atomically
    const admin = getAdminClient();

    const insert: TablesInsert<"restaurants"> = {
      name: data.name,
      slug: data.slug,
      subdomain: data.subdomain,
      city: data.city,
      address: data.address,
      postcode: data.postcode,
      phone: data.phone,
      email: data.email,
      cuisine_type: data.cuisine_type,
      status: "draft",
      onboarding_step: "restaurant-info",
    };

    const { data: restaurant, error: rErr } = await admin
      .from("restaurants")
      .insert(insert)
      .select()
      .single();

    if (rErr) throw new Error(rErr.message);

    // Link the creating user as owner
    const { error: uErr } = await admin.from("restaurant_users").insert({
      restaurant_id: restaurant.id,
      user_id: user.id,
      role: "owner",
    });

    if (uErr) throw new Error(uErr.message);

    // Seed default branding, theme, fulfilment records
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

// ─── updateRestaurant ─────────────────────────────────────────────────────────

const UpdateRestaurantSchema = z.object({
  id: z.string().uuid(),
  patch: z.object({
    name: z.string().min(1).optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    cuisine_type: z.string().optional(),
    status: z.string().optional(),
    onboarding_step: z.string().optional(),
    onboarding_completed: z.boolean().optional(),
  }),
});

export const updateRestaurant = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof UpdateRestaurantSchema>) =>
    UpdateRestaurantSchema.parse(input),
  )
  .handler(async ({ data: { id, patch } }) => {
    const db = getServerClient();
    const update: TablesUpdate<"restaurants"> = patch;

    const { data, error } = await db
      .from("restaurants")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  });
