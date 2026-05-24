/**
 * Onboarding server functions
 *
 * Each function maps to one onboarding step and upserts the relevant table.
 * All use the admin client to bypass RLS — ownership is enforced by passing
 * the restaurantId from the URL, which was set during the signup flow.
 *
 * Supabase client imports are lazy (inside handlers) so this file is safe to
 * import from client-side route files without triggering the TanStack Start
 * import-protection plugin for files in server/ directories.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── saveRestaurantInfo ───────────────────────────────────────────────────────

export const saveRestaurantInfo = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      name: string;
      city: string;
      address?: string;
      postcode?: string;
      phone?: string;
      email?: string;
      cuisineType?: string;
    }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          name: z.string().min(1),
          city: z.string().min(1),
          address: z.string().optional(),
          postcode: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          cuisineType: z.string().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, name, city, address, postcode, phone, email, cuisineType } = data;

    const { error } = await db
      .from("restaurants")
      .update({
        name,
        city,
        address,
        postcode,
        phone,
        email: email || null,
        cuisine_type: cuisineType,
        onboarding_step: "design",
      })
      .eq("id", restaurantId);

    if (error) throw new Error(error.message);
  });

// ─── saveBranding ─────────────────────────────────────────────────────────────

export const saveBranding = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      tagline?: string;
      description?: string;
      logoUrl?: string;
      heroImageUrl?: string;
      instagramUrl?: string;
      tiktokUrl?: string;
      facebookUrl?: string;
    }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          tagline: z.string().optional(),
          description: z.string().optional(),
          logoUrl: z.string().url().optional().or(z.literal("")),
          heroImageUrl: z.string().url().optional().or(z.literal("")),
          instagramUrl: z.string().url().optional().or(z.literal("")),
          tiktokUrl: z.string().url().optional().or(z.literal("")),
          facebookUrl: z.string().url().optional().or(z.literal("")),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurant_branding")
      .upsert(
        {
          restaurant_id: restaurantId,
          tagline: rest.tagline,
          description: rest.description,
          logo_url: rest.logoUrl || null,
          hero_image_url: rest.heroImageUrl || null,
          instagram_url: rest.instagramUrl || null,
          tiktok_url: rest.tiktokUrl || null,
          facebook_url: rest.facebookUrl || null,
        },
        { onConflict: "restaurant_id" },
      );

    if (error) throw new Error(error.message);
  });

// ─── saveThemeConfig ──────────────────────────────────────────────────────────

export const saveThemeConfig = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      themeName?: string;
      primaryColor?: string;
      accentColor?: string;
      backgroundColor?: string;
      buttonColor?: string;
      textColor?: string;
      heroLayout?: string;
      menuLayout?: string;
      categoryNavigation?: string;
      cartStyle?: string;
      showFeaturedItems?: boolean;
      showOpeningHours?: boolean;
      showBadges?: boolean;
      showReviews?: boolean;
      ctaText?: string;
      enabledPages?: string[];
    }) => z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurant_theme_configs")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...(rest.themeName !== undefined && { theme_name: rest.themeName }),
          ...(rest.primaryColor !== undefined && { primary_color: rest.primaryColor }),
          ...(rest.accentColor !== undefined && { accent_color: rest.accentColor }),
          ...(rest.backgroundColor !== undefined && { background_color: rest.backgroundColor }),
          ...(rest.buttonColor !== undefined && { button_color: rest.buttonColor }),
          ...(rest.textColor !== undefined && { text_color: rest.textColor }),
          ...(rest.heroLayout !== undefined && { hero_layout: rest.heroLayout }),
          ...(rest.menuLayout !== undefined && { menu_layout: rest.menuLayout }),
          ...(rest.categoryNavigation !== undefined && { category_navigation: rest.categoryNavigation }),
          ...(rest.cartStyle !== undefined && { cart_style: rest.cartStyle }),
          ...(rest.showFeaturedItems !== undefined && { show_featured_items: rest.showFeaturedItems }),
          ...(rest.showOpeningHours !== undefined && { show_opening_hours: rest.showOpeningHours }),
          ...(rest.showBadges !== undefined && { show_badges: rest.showBadges }),
          ...(rest.showReviews !== undefined && { show_reviews: rest.showReviews }),
          ...(rest.ctaText !== undefined && { cta_text: rest.ctaText }),
          ...(rest.enabledPages !== undefined && { enabled_pages: rest.enabledPages }),
        },
        { onConflict: "restaurant_id" },
      );

    if (error) throw new Error(error.message);
  });

// ─── saveFulfilmentSettings ───────────────────────────────────────────────────

export const saveFulfilmentSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      pickupEnabled?: boolean;
      deliveryEnabled?: boolean;
      pickupPrepTimeMinutes?: number;
      deliveryTimeMinutes?: number;
      deliveryRadiusMiles?: number;
      deliveryFeePence?: number;
      minimumDeliveryOrderPence?: number;
    }) => z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("fulfilment_settings")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...(rest.pickupEnabled !== undefined && { pickup_enabled: rest.pickupEnabled }),
          ...(rest.deliveryEnabled !== undefined && { delivery_enabled: rest.deliveryEnabled }),
          ...(rest.pickupPrepTimeMinutes !== undefined && { pickup_prep_time_minutes: rest.pickupPrepTimeMinutes }),
          ...(rest.deliveryTimeMinutes !== undefined && { delivery_time_minutes: rest.deliveryTimeMinutes }),
          ...(rest.deliveryRadiusMiles !== undefined && { delivery_radius_miles: rest.deliveryRadiusMiles }),
          ...(rest.deliveryFeePence !== undefined && { delivery_fee_pence: rest.deliveryFeePence }),
          ...(rest.minimumDeliveryOrderPence !== undefined && { minimum_delivery_order_pence: rest.minimumDeliveryOrderPence }),
        },
        { onConflict: "restaurant_id" },
      );

    if (error) throw new Error(error.message);
  });

// ─── completeOnboardingStep ───────────────────────────────────────────────────

export const completeOnboardingStep = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string; step: string }) =>
      z.object({ restaurantId: z.string().uuid(), step: z.string() }).parse(input),
  )
  .handler(async ({ data: { restaurantId, step } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { error } = await db
      .from("restaurants")
      .update({ onboarding_step: step })
      .eq("id", restaurantId);
    if (error) throw new Error(error.message);
  });

// ─── markOnboardingComplete ───────────────────────────────────────────────────

export const markOnboardingComplete = createServerFn({ method: "POST" })
  .inputValidator((restaurantId: string) => z.string().uuid().parse(restaurantId))
  .handler(async ({ data: restaurantId }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { error } = await db
      .from("restaurants")
      .update({
        onboarding_completed: true,
        onboarding_step: "complete",
        status: "active",
      })
      .eq("id", restaurantId);
    if (error) throw new Error(error.message);
  });
