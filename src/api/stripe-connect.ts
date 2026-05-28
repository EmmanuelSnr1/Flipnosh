/**
 * Stripe Connect Express server functions.
 *
 * All functions follow the TanStack Start pattern:
 *   - Exported from src/api/ so route files can import them client-safely
 *   - Server-only helpers (Stripe, Supabase admin) are lazy-imported inside
 *     handler bodies — they are never bundled into the browser
 *   - STRIPE_SECRET_KEY is never exposed to the client
 *
 * Auth pattern:
 *   Supabase stores the session in browser localStorage (not cookies), so it
 *   is never automatically forwarded to server functions.  Callers must read
 *   `(await supabase.auth.getSession()).data.session?.access_token` and pass
 *   it as `accessToken` in the request payload.  The server validates it with
 *   `getServerClient().auth.getUser(accessToken)` — this hits the Supabase
 *   Auth API with the real JWT and returns the authenticated user.
 *   The admin client is then used ONLY for DB writes after auth is confirmed.
 *
 * Flow overview:
 *   createConnectAccountLink  → creates / reuses Express account → returns onboarding URL
 *   refreshConnectAccountStatus → reads live Stripe account state → updates restaurants row
 *   createExpressDashboardLink  → returns Stripe Express login link URL
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Read the app base URL from env (defaults to localhost:8080 in dev). */
function appUrl(): string {
  return (
    (typeof process !== "undefined"
      ? process.env.VITE_APP_URL ?? process.env.APP_URL
      : undefined) ??
    (import.meta.env.VITE_APP_URL as string | undefined) ??
    "http://localhost:8080"
  );
}

// ─── Stripe status shape ──────────────────────────────────────────────────────

export type StripeConnectStatus = {
  stripeAccountId:       string | null;
  detailsSubmitted:      boolean;
  chargesEnabled:        boolean;
  payoutsEnabled:        boolean;
  onboardingComplete:    boolean;
  /** Stripe requirements that must be resolved before charges/payouts are enabled */
  currentlyDue:          string[];
  disabledReason:        string | null;
};

// ─── createConnectAccountLink ─────────────────────────────────────────────────

/**
 * Creates (or reuses) a Stripe Express account for the restaurant and
 * returns a one-time onboarding URL.
 *
 * Security: verifies the caller owns the restaurant before touching Stripe.
 * Caller must supply the Supabase access_token from their active session.
 */
export const createConnectAccountLink = createServerFn({ method: "POST" })
  .inputValidator((input: { restaurantId: string; accessToken: string }) =>
    z.object({
      restaurantId: z.string().uuid(),
      accessToken:  z.string().min(1, "Access token required — are you signed in?"),
    }).parse(input),
  )
  .handler(async ({ data: { restaurantId, accessToken } }): Promise<{ url: string }> => {
    const { getServerClient, getAdminClient } = await import("@/lib/supabase/server");
    const { getStripe }                       = await import("@/lib/stripe/server");

    const stripe = getStripe();

    // ── 1. Verify caller identity via JWT ─────────────────────────────────────
    // Use the anon (server) client for auth validation — NOT the admin client.
    const serverDb = getServerClient();
    const { data: { user }, error: authErr } = await serverDb.auth.getUser(accessToken);
    if (authErr || !user) throw new Error("Not authenticated — please sign in and try again");

    // ── 2. Verify membership using admin client (after auth is confirmed) ─────
    const db = getAdminClient();

    const { data: membership } = await db
      .from("restaurant_users")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) throw new Error("You do not have access to this restaurant");

    // ── 3. Load restaurant row ────────────────────────────────────────────────
    const { data: restaurant, error: rErr } = await db
      .from("restaurants")
      .select("id, name, email, stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (rErr || !restaurant) throw new Error("Restaurant not found");

    // ── 4. Create or reuse the Stripe Express account ─────────────────────────
    let accountId = restaurant.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type:    "express",
        country: "GB",
        ...(restaurant.email ? { email: restaurant.email } : {}),
        business_profile: {
          name: restaurant.name,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
      });

      accountId = account.id;

      // Persist the account id immediately — the user might close the tab
      const { error: updateErr } = await db
        .from("restaurants")
        .update({ stripe_account_id: accountId })
        .eq("id", restaurantId);

      if (updateErr) throw new Error(`Failed to save Stripe account id: ${updateErr.message}`);
    }

    // ── 5. Create the one-time onboarding link ────────────────────────────────
    const base = appUrl();
    const link = await stripe.accountLinks.create({
      account:     accountId,
      type:        "account_onboarding",
      refresh_url: `${base}/dashboard/payments?stripe=refresh&r=${restaurantId}`,
      return_url:  `${base}/dashboard/payments?stripe=return&r=${restaurantId}`,
    });

    return { url: link.url };
  });

// ─── refreshConnectAccountStatus ──────────────────────────────────────────────

/**
 * Reads the live account state from Stripe and persists it to Supabase.
 * Called after the user returns from onboarding or clicks "Refresh status".
 */
export const refreshConnectAccountStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { restaurantId: string; accessToken: string }) =>
    z.object({
      restaurantId: z.string().uuid(),
      accessToken:  z.string().min(1, "Access token required — are you signed in?"),
    }).parse(input),
  )
  .handler(async ({ data: { restaurantId, accessToken } }): Promise<StripeConnectStatus> => {
    const { getServerClient, getAdminClient } = await import("@/lib/supabase/server");
    const { getStripe }                       = await import("@/lib/stripe/server");

    const stripe = getStripe();

    // ── 1. Verify caller identity ─────────────────────────────────────────────
    const serverDb = getServerClient();
    const { data: { user }, error: authErr } = await serverDb.auth.getUser(accessToken);
    if (authErr || !user) throw new Error("Not authenticated — please sign in and try again");

    // ── 2. Verify membership ──────────────────────────────────────────────────
    const db = getAdminClient();

    const { data: membership } = await db
      .from("restaurant_users")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) throw new Error("You do not have access to this restaurant");

    // ── 3. Load restaurant ────────────────────────────────────────────────────
    const { data: restaurant, error: rErr } = await db
      .from("restaurants")
      .select("stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (rErr || !restaurant) throw new Error("Restaurant not found");

    if (!restaurant.stripe_account_id) {
      // Nothing connected yet — return zeroed status
      return {
        stripeAccountId:    null,
        detailsSubmitted:   false,
        chargesEnabled:     false,
        payoutsEnabled:     false,
        onboardingComplete: false,
        currentlyDue:       [],
        disabledReason:     null,
      };
    }

    // ── 4. Retrieve account from Stripe ───────────────────────────────────────
    const account = await stripe.accounts.retrieve(restaurant.stripe_account_id);

    const chargesEnabled     = account.charges_enabled     ?? false;
    const payoutsEnabled     = account.payouts_enabled     ?? false;
    const detailsSubmitted   = account.details_submitted   ?? false;
    const onboardingComplete = chargesEnabled && payoutsEnabled;
    const currentlyDue       = account.requirements?.currently_due  ?? [];
    const disabledReason     = account.requirements?.disabled_reason ?? null;

    // ── 5. Persist latest state to Supabase ───────────────────────────────────
    await db
      .from("restaurants")
      .update({
        stripe_charges_enabled:     chargesEnabled,
        stripe_payouts_enabled:     payoutsEnabled,
        stripe_details_submitted:   detailsSubmitted,
        stripe_onboarding_complete: onboardingComplete,
      })
      .eq("id", restaurantId);

    return {
      stripeAccountId:    restaurant.stripe_account_id,
      detailsSubmitted,
      chargesEnabled,
      payoutsEnabled,
      onboardingComplete,
      currentlyDue,
      disabledReason,
    };
  });

// ─── createExpressDashboardLink ───────────────────────────────────────────────

/**
 * Returns a Stripe Express dashboard login link so the restaurant owner can
 * view their payouts, transactions, and account settings directly in Stripe.
 */
export const createExpressDashboardLink = createServerFn({ method: "POST" })
  .inputValidator((input: { restaurantId: string; accessToken: string }) =>
    z.object({
      restaurantId: z.string().uuid(),
      accessToken:  z.string().min(1, "Access token required — are you signed in?"),
    }).parse(input),
  )
  .handler(async ({ data: { restaurantId, accessToken } }): Promise<{ url: string }> => {
    const { getServerClient, getAdminClient } = await import("@/lib/supabase/server");
    const { getStripe }                       = await import("@/lib/stripe/server");

    const stripe = getStripe();

    // ── 1. Verify caller identity ─────────────────────────────────────────────
    const serverDb = getServerClient();
    const { data: { user }, error: authErr } = await serverDb.auth.getUser(accessToken);
    if (authErr || !user) throw new Error("Not authenticated — please sign in and try again");

    // ── 2. Verify membership ──────────────────────────────────────────────────
    const db = getAdminClient();

    const { data: membership } = await db
      .from("restaurant_users")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) throw new Error("You do not have access to this restaurant");

    // ── 3. Load restaurant ────────────────────────────────────────────────────
    const { data: restaurant, error: rErr } = await db
      .from("restaurants")
      .select("stripe_account_id")
      .eq("id", restaurantId)
      .single();

    if (rErr || !restaurant) throw new Error("Restaurant not found");
    if (!restaurant.stripe_account_id) throw new Error("No Stripe account connected");

    // ── 4. Create login link ──────────────────────────────────────────────────
    const loginLink = await stripe.accounts.createLoginLink(
      restaurant.stripe_account_id,
    );

    return { url: loginLink.url };
  });
