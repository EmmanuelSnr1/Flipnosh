/**
 * Billing server functions.
 *
 * All Supabase and Stripe imports are lazy (inside handlers) so this file is
 * safe to import from client-side route files.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Tables } from "@/types/supabase";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type SubscriptionInfo = Tables<"platform_subscriptions">;

// ─── getRestaurantSubscription ────────────────────────────────────────────────

export const getRestaurantSubscription = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<SubscriptionInfo | null> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data } = await db
      .from("platform_subscriptions")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    return data ?? null;
  });

// ─── createTrialSubscription ──────────────────────────────────────────────────

export const createTrialSubscription = createServerFn({ method: "POST" })
  .inputValidator((restaurantId: string) =>
    z.string().uuid().parse(restaurantId),
  )
  .handler(async ({ data: restaurantId }): Promise<SubscriptionInfo> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const trialEndsAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Upsert — idempotent if called twice for the same restaurant
    const { data, error } = await db
      .from("platform_subscriptions")
      .upsert(
        {
          restaurant_id: restaurantId,
          plan: "starter",
          status: "trialing",
          trial_ends_at: trialEndsAt,
          billing_cycle: "monthly",
        },
        { onConflict: "restaurant_id" },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  });

// ─── upgradeSubscription ──────────────────────────────────────────────────────

export const upgradeSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string; plan: string }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          plan: z.enum(["starter", "growth", "pro"]),
        })
        .parse(input),
  )
  .handler(async ({ data }): Promise<{ checkoutUrl: string }> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Fetch current subscription and restaurant details
    const [{ data: sub }, { data: restaurant }] = await Promise.all([
      db
        .from("platform_subscriptions")
        .select("*")
        .eq("restaurant_id", data.restaurantId)
        .single(),
      db
        .from("restaurants")
        .select("name, email")
        .eq("id", data.restaurantId)
        .single(),
    ]);

    if (!sub || !restaurant) throw new Error("Restaurant or subscription not found");

    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
    if (!stripeKey) {
      // Stripe not configured yet — return a placeholder URL
      return { checkoutUrl: `/dashboard/billing?r=${data.restaurantId}&upgrade=${data.plan}` };
    }

    const { createStripeCustomer, createCheckoutSession, planToPriceId } =
      await import("@/lib/stripe/billing");

    // Ensure a Stripe customer exists
    let customerId = sub.stripe_customer_id ?? "";
    if (!customerId) {
      customerId = await createStripeCustomer({
        email: restaurant.email ?? "",
        name: restaurant.name,
        restaurantId: data.restaurantId,
      });
      await db
        .from("platform_subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("restaurant_id", data.restaurantId);
    }

    const baseUrl = process.env.VITE_APP_URL ?? "http://localhost:8080";
    const checkoutUrl = await createCheckoutSession({
      stripeCustomerId: customerId,
      priceId: planToPriceId(data.plan),
      restaurantId: data.restaurantId,
      successUrl: `${baseUrl}/dashboard/billing?r=${data.restaurantId}&upgraded=1`,
      cancelUrl: `${baseUrl}/dashboard/billing?r=${data.restaurantId}`,
    });

    return { checkoutUrl };
  });

// ─── openBillingPortal ────────────────────────────────────────────────────────

export const openBillingPortal = createServerFn({ method: "POST" })
  .inputValidator((restaurantId: string) =>
    z.string().uuid().parse(restaurantId),
  )
  .handler(async ({ data: restaurantId }): Promise<{ portalUrl: string }> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data: sub } = await db
      .from("platform_subscriptions")
      .select("stripe_customer_id")
      .eq("restaurant_id", restaurantId)
      .single();

    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
    if (!stripeKey || !sub?.stripe_customer_id) {
      return { portalUrl: `/dashboard/billing?r=${restaurantId}` };
    }

    const { createBillingPortalSession } = await import("@/lib/stripe/billing");
    const baseUrl = process.env.VITE_APP_URL ?? "http://localhost:8080";
    const portalUrl = await createBillingPortalSession({
      stripeCustomerId: sub.stripe_customer_id,
      returnUrl: `${baseUrl}/dashboard/billing?r=${restaurantId}`,
    });

    return { portalUrl };
  });

// ─── cancelSubscription ───────────────────────────────────────────────────────

export const cancelSubscription = createServerFn({ method: "POST" })
  .inputValidator((restaurantId: string) =>
    z.string().uuid().parse(restaurantId),
  )
  .handler(async ({ data: restaurantId }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { error } = await db
      .from("platform_subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("restaurant_id", restaurantId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
