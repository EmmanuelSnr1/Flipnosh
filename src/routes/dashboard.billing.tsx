import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Shield,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { dashboardSearch } from "@/api/dashboard";
import { getRestaurantSubscription, upgradeSubscription, openBillingPortal, cancelSubscription } from "@/api/billing";
import {
  PLAN_DEFINITIONS,
  getRemainingTrialDays,
  isUpgrade,
  type Plan,
} from "@/lib/billing/plans";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/billing")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) =>
    getRestaurantSubscription({ data: r! }),
  component: BillingPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    trialing: { label: "Free trial", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    active: { label: "Active", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    past_due: { label: "Payment due", cls: "bg-destructive/15 text-destructive" },
    canceled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
    paused: { label: "Paused", cls: "bg-muted text-muted-foreground" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function BillingPage() {
  const { r } = Route.useSearch();
  const sub = Route.useLoaderData();
  const [upgrading, setUpgrading] = useState<Plan | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const restaurantId = r!;

  // Derived
  const plan = sub?.plan ?? "starter";
  const status = sub?.status ?? "trialing";
  const planDef = PLAN_DEFINITIONS[plan as Plan] ?? PLAN_DEFINITIONS.starter;
  const trialDays = getRemainingTrialDays(sub?.trial_ends_at ?? null);
  const isPilot = plan === "pilot";

  async function handleUpgrade(targetPlan: Plan) {
    setUpgrading(targetPlan);
    try {
      const { checkoutUrl } = await upgradeSubscription({
        data: { restaurantId, plan: targetPlan },
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error("Could not start upgrade. Please try again.");
      setUpgrading(null);
    }
  }

  async function handlePortal() {
    try {
      const { portalUrl } = await openBillingPortal({ data: restaurantId });
      window.location.href = portalUrl;
    } catch {
      toast.error("Could not open billing portal.");
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure? Your access continues until the end of the billing period."))
      return;
    setCancelling(true);
    try {
      await cancelSubscription({ data: restaurantId });
      toast.success("Subscription will cancel at end of billing period.");
    } catch {
      toast.error("Could not cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <PageHeader
        title="Billing"
        subtitle="Manage your FlipNosh subscription and plan."
      />

      {/* ── Current plan ── */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold">{planDef.name} plan</h2>
              <StatusChip status={status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {planDef.description}
            </p>
          </div>
          {!isPilot && (
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold">{planDef.monthlyPriceDisplay}</p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
          )}
        </div>

        {/* Trial alert */}
        {status === "trialing" && trialDays > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {trialDays} day{trialDays !== 1 ? "s" : ""} left in your free trial
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                After your trial ends on{" "}
                <strong>{fmtDate(sub?.trial_ends_at ?? null)}</strong>, you'll
                need an active subscription to keep using FlipNosh.
              </p>
            </div>
          </div>
        )}

        {/* Trial expired */}
        {status === "trialing" && trialDays === 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Your free trial has ended
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Choose a plan below to reactivate your storefront.
              </p>
            </div>
          </div>
        )}

        {/* Past due */}
        {status === "past_due" && (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-4">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Payment failed — action required
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Update your payment method to keep your storefront active.
              </p>
            </div>
          </div>
        )}

        {/* Pilot note */}
        {isPilot && (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/10 border border-primary/20 p-4">
            <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary">
                Internal pilot — full access at no charge
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                This restaurant is on the FlipNosh pilot programme. All Pro
                features are enabled. No billing applies.
              </p>
            </div>
          </div>
        )}

        {/* Active plan details */}
        {status === "active" && !isPilot && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Next billing date</p>
              <p className="mt-1 text-sm font-medium">
                {fmtDate(sub?.current_period_end ?? null)}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Billing cycle</p>
              <p className="mt-1 text-sm font-medium capitalize">
                {sub?.billing_cycle ?? "monthly"}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isPilot && (
          <div className="mt-6 flex flex-wrap gap-3">
            {status === "active" && (
              <button
                onClick={handlePortal}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Manage billing
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            {status === "active" && !sub?.cancel_at_period_end && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel subscription"}
              </button>
            )}
            {sub?.cancel_at_period_end && (
              <p className="text-sm text-muted-foreground italic">
                Your subscription is set to cancel on{" "}
                {fmtDate(sub.current_period_end)}.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Included features ── */}
      {!isPilot && (
        <section className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">What's included in your plan</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {planDef.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Upgrade section ── */}
      {!isPilot && (
        <section>
          <h3 className="font-semibold mb-4">
            {plan === "pro" ? "You're on our best plan" : "Upgrade your plan"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["starter", "growth", "pro"] as Plan[]).map((p) => {
              const pd = PLAN_DEFINITIONS[p];
              const isCurrent = p === plan;
              const canUpgrade = isUpgrade(plan, p);
              const isDowngrade = !isCurrent && !canUpgrade;

              return (
                <div
                  key={p}
                  className={`relative rounded-2xl border p-5 flex flex-col ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : pd.recommended
                      ? "border-primary/40"
                      : "border-border bg-card"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                        Current
                      </span>
                    </div>
                  )}
                  {!isCurrent && pd.recommended && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary/80 px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold">{pd.name}</p>
                    <p className="text-2xl font-bold mt-1">{pd.monthlyPriceDisplay}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {pd.description}
                    </p>
                  </div>

                  <div className="mt-4 flex-1">
                    <ul className="space-y-1.5">
                      {pd.highlights.slice(0, 4).map((h) => (
                        <li key={h} className="flex items-start gap-2 text-xs">
                          <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{h}</span>
                        </li>
                      ))}
                      {pd.highlights.length > 4 && (
                        <li className="text-xs text-muted-foreground pl-5">
                          + {pd.highlights.length - 4} more
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="mt-4">
                    {isCurrent ? (
                      <div className="w-full rounded-full border border-primary/30 py-2 text-center text-xs font-medium text-primary">
                        Your plan
                      </div>
                    ) : canUpgrade ? (
                      <button
                        onClick={() => handleUpgrade(p)}
                        disabled={upgrading === p}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        {upgrading === p ? (
                          "Redirecting…"
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5" />
                            Upgrade to {pd.name}
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-border py-2 text-xs font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        {isDowngrade ? "Downgrade" : "Lower plan"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            All plans include a 30-day free trial · No credit card required ·
            Cancel any time
          </p>
        </section>
      )}

      {/* ── Need help ── */}
      <section className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold">Need help or have a question?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Our team is happy to walk you through options or answer billing
            questions.
          </p>
        </div>
        <a
          href="mailto:hello@flipnosh.com"
          className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Contact support
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </a>
      </section>
    </div>
  );
}
