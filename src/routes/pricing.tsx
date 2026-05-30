import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Zap, Shield, Lock } from "lucide-react";
import { PLAN_DEFINITIONS } from "@/lib/billing/plans";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const Route = createFileRoute("/pricing")({ component: PricingPage });

function PricingPage() {
  const plans = [
    PLAN_DEFINITIONS.starter,
    PLAN_DEFINITIONS.growth,
    PLAN_DEFINITIONS.pro,
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Zap className="h-3.5 w-3.5" />
          30-day free trial · No card required
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
          Stop paying 30% to{" "}
          <span className="text-primary">Deliveroo.</span>
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          FlipNosh gives independent restaurants their own branded direct-ordering storefront.
          Own your customers. Keep your margins.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          A restaurant doing £10,000/month on Deliveroo pays <strong className="text-foreground">~£3,000 in commission</strong>.
          FlipNosh costs <strong className="text-foreground">£99/month</strong>.
        </p>
      </section>

      {/* ── Plans ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.recommended
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.monthlyPriceDisplay}</span>
                <span className="text-muted-foreground text-sm">/month</span>
                <p className="mt-1 text-xs text-muted-foreground">Billed monthly · cancel any time</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`rounded-full py-2.5 text-center text-sm font-semibold transition-opacity ${
                  plan.recommended
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border hover:bg-muted"
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          All plans start with a 30-day free trial. No credit card required.
        </p>
      </section>

      {/* ── Feature comparison ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">Compare plans</h2>
        <ComparisonTable />
      </section>

      {/* ── Commission savings ── */}
      <section className="bg-primary/5 border-y border-primary/10">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">The commission problem is real</h2>
          <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
            Marketplaces charge 25–35% per order. That's not a fee — it's a tax on every
            plate of food you sell. FlipNosh replaces that with a flat monthly subscription.
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: "Monthly GMV", value: "£5,000", sub: "typical independent" },
              { label: "Marketplace cost", value: "£1,500", sub: "at 30% commission" },
              { label: "FlipNosh cost", value: "£99", sub: "Starter plan / month" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card border border-border p-6">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            That's over{" "}
            <strong className="text-foreground">£17,000 saved every year</strong>{" "}
            for a restaurant doing £5k/month in online orders.
          </p>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-border bg-card p-5"
            >
              <summary className="font-medium cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <span className="ml-4 text-muted-foreground text-xs group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to own your customers?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join restaurants already converting marketplace customers into loyal direct customers.
            30-day free trial, cancel any time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Launch your storefront
            </Link>
            <a
              href="mailto:hello@flipnosh.com"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted"
            >
              Book a demo
            </a>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────

type Row = { label: string; starter: boolean | string; growth: boolean | string; pro: boolean | string };

const COMPARISON_ROWS: Row[] = [
  { label: "Branded storefront", starter: true, growth: true, pro: true },
  { label: "Direct ordering", starter: true, growth: true, pro: true },
  { label: "Pickup + delivery", starter: true, growth: true, pro: true },
  { label: "QR campaigns", starter: true, growth: true, pro: true },
  { label: "Customer database", starter: true, growth: true, pro: true },
  { label: "Menu management", starter: true, growth: true, pro: true },
  { label: "Basic analytics", starter: true, growth: true, pro: true },
  { label: "Storefront pages", starter: "3", growth: "5", pro: "Unlimited" },
  { label: "Themes", starter: "1", growth: "Unlimited", pro: "Unlimited" },
  { label: "Advanced analytics", starter: false, growth: true, pro: true },
  { label: "Offers & loyalty", starter: false, growth: true, pro: true },
  { label: "Customer segmentation", starter: false, growth: true, pro: true },
  { label: "Marketing automations", starter: false, growth: true, pro: true },
  { label: "Priority support", starter: false, growth: true, pro: true },
  { label: "Multi-location", starter: false, growth: false, pro: true },
  { label: "Advanced CRM", starter: false, growth: false, pro: true },
  { label: "AI features", starter: false, growth: false, pro: true },
  { label: "API access", starter: false, growth: false, pro: true },
];

function Cell({ val }: { val: boolean | string }) {
  if (typeof val === "string")
    return <span className="text-sm font-medium">{val}</span>;
  if (val) return <Check className="h-4 w-4 text-primary mx-auto" />;
  return <Lock className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />;
}

function ComparisonTable() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-5 py-3 text-left font-medium text-muted-foreground">Feature</th>
            <th className="px-4 py-3 text-center font-semibold">Starter</th>
            <th className="px-4 py-3 text-center font-semibold text-primary">Growth</th>
            <th className="px-4 py-3 text-center font-semibold">Pro</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr
              key={row.label}
              className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
            >
              <td className="px-5 py-2.5 text-sm">{row.label}</td>
              <td className="px-4 py-2.5 text-center"><Cell val={row.starter} /></td>
              <td className="px-4 py-2.5 text-center bg-primary/5"><Cell val={row.growth} /></td>
              <td className="px-4 py-2.5 text-center"><Cell val={row.pro} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Do I need to replace Deliveroo and Uber Eats completely?",
    a: "No. FlipNosh is an additional direct channel, not a replacement. You keep your marketplace presence while building a direct customer base that you own and can market to for free.",
  },
  {
    q: "Is there a commission on orders placed through FlipNosh?",
    a: "None. Zero. You keep 100% of every order placed through your FlipNosh storefront. You only pay the flat monthly subscription fee.",
  },
  {
    q: "What happens after the 30-day trial?",
    a: "After your trial ends, you'll be prompted to add a payment method. If you choose not to, your storefront is paused until you upgrade. No charges during the trial.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your current billing period.",
  },
  {
    q: "Does FlipNosh handle payments from customers?",
    a: "Yes — customer checkout is powered by Stripe, and funds go directly into your Stripe account. FlipNosh never touches your revenue.",
  },
  {
    q: "What's the difference between plans?",
    a: "Starter covers everything you need to take direct orders. Growth adds advanced analytics, loyalty, and automation. Pro adds multi-location support, AI features, and API access for high-volume operations.",
  },
];
