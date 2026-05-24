import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { CheckCircle2, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { store, useStore } from "@/lib/mock-store";
import type { StripeStatus } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/payments")({
  component: PaymentsPage,
});

const META: Record<
  StripeStatus,
  { label: string; tone: string; icon: typeof CheckCircle2; description: string }
> = {
  not_started: {
    label: "Not started",
    tone: "bg-zinc-100 text-zinc-700",
    icon: AlertCircle,
    description: "Connect Stripe to start accepting payments directly into your account.",
  },
  onboarding: {
    label: "Onboarding in progress",
    tone: "bg-amber-100 text-amber-700",
    icon: Loader2,
    description: "Stripe is verifying your business details. This usually takes a few minutes.",
  },
  connected: {
    label: "Connected",
    tone: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
    description: "Payments land directly in your bank account. FlipNosh never holds your money.",
  },
};

function PaymentsPage() {
  const { stripeStatus } = useStore();
  const m = META[stripeStatus];
  const Icon = m.icon;

  const setStatus = (s: StripeStatus) => {
    store.setStripeStatus(s);
    toast.success(`Stripe status → ${META[s].label}`);
  };

  return (
    <>
      <PageHeader title="Payments" subtitle="Stripe Connect onboarding and payouts." />
      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Mock mode — Stripe is not actually connected. Use the simulate buttons below.
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${m.tone}`}>
                <Icon className={`h-6 w-6 ${stripeStatus === "onboarding" ? "animate-spin" : ""}`} />
              </span>
              <div className="flex-1">
                <h2 className="font-semibold">Stripe Connect: {m.label}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["not_started", "onboarding", "connected"] as StripeStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        stripeStatus === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Simulate: {META[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs text-muted-foreground">Next payout</p>
            <p className="mt-1 text-2xl font-bold">
              {stripeStatus === "connected" ? "£842.10" : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stripeStatus === "connected" ? "Estimated · tomorrow" : "Available once connected"}
            </p>
            <div className="mt-5 pt-5 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volume (30d)</span>
                <span>{stripeStatus === "connected" ? "£12,484" : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fees (30d)</span>
                <span>{stripeStatus === "connected" ? "£174.02" : "—"}</span>
              </div>
            </div>
          </div>

          {stripeStatus === "connected" && (
            <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Recent payouts
              </h3>
              <ul className="mt-3 divide-y divide-border text-sm">
                {[
                  { d: "Yesterday", amt: "£612.40" },
                  { d: "Apr 20", amt: "£980.20" },
                  { d: "Apr 19", amt: "£723.10" },
                ].map((p) => (
                  <li key={p.d} className="flex justify-between py-2.5">
                    <span className="text-muted-foreground">{p.d}</span>
                    <span className="font-medium">{p.amt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}