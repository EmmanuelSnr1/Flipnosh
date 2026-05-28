import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  CreditCard,
  Building2,
  ShieldCheck,
  Landmark,
} from "lucide-react";
import {
  createConnectAccountLink,
  refreshConnectAccountStatus,
  createExpressDashboardLink,
  type StripeConnectStatus,
} from "@/api/stripe-connect";
import { dashboardSearch, type DashboardContext } from "@/api/dashboard";
import { Route as DashboardRoute } from "./dashboard";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/payments")({
  validateSearch: dashboardSearch,
  component: PaymentsPage,
});

// ── Status metadata ───────────────────────────────────────────────────────────

type ReadinessLevel = "not_connected" | "onboarding" | "submitted" | "ready";

function getReadiness(status: StripeConnectStatus | null): ReadinessLevel {
  if (!status?.stripeAccountId) return "not_connected";
  if (status.chargesEnabled && status.payoutsEnabled) return "ready";
  if (status.detailsSubmitted) return "submitted";
  return "onboarding";
}

const READINESS_META: Record<
  ReadinessLevel,
  { label: string; description: string; color: string; icon: typeof CheckCircle2 }
> = {
  not_connected: {
    label: "Not connected",
    description:
      "Connect Stripe to start accepting online payments directly into your bank account.",
    color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    icon: AlertCircle,
  },
  onboarding: {
    label: "Onboarding in progress",
    description:
      "Your Stripe account has been created. Continue onboarding to verify your business and bank details.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    icon: Clock,
  },
  submitted: {
    label: "Verification in progress",
    description:
      "Your details are submitted — Stripe is verifying your business. This usually takes a few minutes.",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    icon: Clock,
  },
  ready: {
    label: "Connected & ready",
    description:
      "Charges and payouts are enabled. Payments will land directly in your bank account.",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    icon: CheckCircle2,
  },
};

// ── Page component ────────────────────────────────────────────────────────────

function PaymentsPage() {
  const { restaurant } = DashboardRoute.useLoaderData() as DashboardContext;
  const { r: restaurantId } = Route.useSearch();
  const router = useRouter();

  // Build initial status from the data already in Supabase (loaded by the
  // dashboard parent loader) — no extra round-trip on mount
  const [status, setStatus] = useState<StripeConnectStatus>({
    stripeAccountId:    restaurant.stripe_account_id,
    detailsSubmitted:   restaurant.stripe_details_submitted,
    chargesEnabled:     restaurant.stripe_charges_enabled,
    payoutsEnabled:     restaurant.stripe_payouts_enabled,
    onboardingComplete: restaurant.stripe_onboarding_complete,
    currentlyDue:       [],
    disabledReason:     null,
  });

  const [connecting,  setConnecting]  = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [dashLinking, setDashLinking] = useState(false);

  // ── Auto-refresh when returning from Stripe onboarding ───────────────────
  useEffect(() => {
    const search = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const stripeParam = search.get("stripe");

    if ((stripeParam === "return" || stripeParam === "refresh") && restaurantId) {
      void doRefresh(/* silent */ false);
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auth helper ───────────────────────────────────────────────────────────

  /**
   * Reads the current Supabase session from the browser client.
   * Supabase stores the JWT in localStorage (not cookies), so server
   * functions cannot read it automatically — we pass it explicitly.
   */
  const getAccessToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not signed in — please log in and try again");
    return session.access_token;
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const doConnect = async () => {
    if (!restaurantId || connecting) return;
    setConnecting(true);
    try {
      const accessToken = await getAccessToken();
      const { url } = await createConnectAccountLink({ data: { restaurantId, accessToken } });
      window.location.href = url; // Redirect to Stripe — page leaves
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start Stripe onboarding");
      setConnecting(false);
    }
  };

  const doRefresh = async (showToast = true) => {
    if (!restaurantId || refreshing) return;
    setRefreshing(true);
    try {
      const accessToken = await getAccessToken();
      const fresh = await refreshConnectAccountStatus({ data: { restaurantId, accessToken } });
      setStatus(fresh);
      await router.invalidate(); // Sync parent loader cache
      if (showToast) {
        const level = getReadiness(fresh);
        if (level === "ready") {
          toast.success("Stripe is fully connected — payments enabled!");
        } else if (level === "submitted") {
          toast.info("Details submitted — Stripe is still verifying your account.");
        } else {
          toast.info("Status refreshed.");
        }
      }
    } catch (err) {
      if (showToast) {
        toast.error(err instanceof Error ? err.message : "Failed to refresh status");
      }
    } finally {
      setRefreshing(false);
    }
  };

  const doOpenDashboard = async () => {
    if (!restaurantId || dashLinking || !status.stripeAccountId) return;
    setDashLinking(true);
    try {
      const accessToken = await getAccessToken();
      const { url } = await createExpressDashboardLink({ data: { restaurantId, accessToken } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open Stripe dashboard");
    } finally {
      setDashLinking(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const level   = getReadiness(status);
  const meta    = READINESS_META[level];
  const Icon    = meta.icon;
  const isReady = level === "ready";

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Stripe Connect onboarding and payouts."
      />

      <div className="p-6 space-y-6 max-w-4xl">
        {/* ── Main status card ── */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
              <Icon className="h-6 w-6" />
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Stripe Connect</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>

              {/* Requirements outstanding */}
              {status.currentlyDue.length > 0 && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Action needed from Stripe:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {status.currentlyDue.map((r) => (
                      <li key={r}>{r.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disabled reason */}
              {status.disabledReason && (
                <p className="mt-2 text-xs text-destructive">
                  Disabled: {status.disabledReason.replace(/_/g, " ")}
                </p>
              )}

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap gap-2">
                {/* Not connected → primary CTA */}
                {level === "not_connected" && (
                  <button
                    onClick={doConnect}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <CreditCard className="h-4 w-4" />
                    {connecting ? "Opening Stripe…" : "Connect Stripe"}
                  </button>
                )}

                {/* Onboarding started but not complete → resume */}
                {(level === "onboarding" || level === "submitted") && (
                  <button
                    onClick={doConnect}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {connecting ? "Opening Stripe…" : "Continue onboarding"}
                  </button>
                )}

                {/* Refresh status — shown whenever an account exists */}
                {status.stripeAccountId && (
                  <button
                    onClick={() => void doRefresh()}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Refreshing…" : "Refresh status"}
                  </button>
                )}

                {/* Express dashboard — only when account exists */}
                {status.stripeAccountId && (
                  <button
                    onClick={doOpenDashboard}
                    disabled={dashLinking}
                    className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {dashLinking ? "Opening…" : "Open Stripe dashboard"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Status flags ── */}
        {status.stripeAccountId && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatusFlag
              label="Details submitted"
              active={status.detailsSubmitted}
              activeText="Submitted to Stripe"
              inactiveText="Not yet submitted"
            />
            <StatusFlag
              label="Charges enabled"
              active={status.chargesEnabled}
              activeText="Can accept payments"
              inactiveText="Not yet enabled"
            />
            <StatusFlag
              label="Payouts enabled"
              active={status.payoutsEnabled}
              activeText="Payouts to bank active"
              inactiveText="Not yet enabled"
            />
          </div>
        )}

        {/* ── What you need — shown when not connected yet ── */}
        {level === "not_connected" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold mb-4">What Stripe will ask for</h3>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <InfoCard
                icon={<Building2 className="h-4 w-4" />}
                title="Business details"
                body="Legal name, trading address, and VAT number if applicable."
              />
              <InfoCard
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Identity verification"
                body="Photo ID check for the business owner — required by UK regulations."
              />
              <InfoCard
                icon={<Landmark className="h-4 w-4" />}
                title="Bank account"
                body="UK current account for payouts. Funds arrive in 2–3 business days."
              />
            </div>
          </div>
        )}

        {/* ── Ready — payout summary stub ── */}
        {isReady && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4" /> Payouts
            </h3>
            <p className="text-sm text-muted-foreground">
              Open your Stripe Express dashboard to view payout history, balances, and
              transaction details.
            </p>
            <button
              onClick={doOpenDashboard}
              disabled={dashLinking}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <ExternalLink className="h-4 w-4" />
              {dashLinking ? "Opening…" : "Open Stripe dashboard"}
            </button>
          </div>
        )}

        {/* ── Storefront readiness ── */}
        <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Online payments: </span>
          {isReady
            ? "Ready to accept card payments from customers."
            : "Customers can still place orders — they pay on collection or delivery until Stripe is fully connected."}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusFlag({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-block h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
        />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`text-sm font-medium ${active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
        {active ? activeText : inactiveText}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 text-primary mb-1">
        {icon}
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
