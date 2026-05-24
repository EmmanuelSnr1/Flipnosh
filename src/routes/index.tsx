import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Store,
  QrCode,
  Users,
  CreditCard,
  LayoutDashboard,
  ArrowRight,
  Check,
  Zap,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Star,
} from "lucide-react";
import { PLAN_DEFINITIONS } from "@/lib/billing/plans";
import { useInView } from "@/hooks/use-in-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlipNosh — Branded direct ordering for restaurants" },
      {
        name: "description",
        content:
          "Take back your margin and your customers. FlipNosh gives independent restaurants a branded direct ordering storefront in minutes.",
      },
      {
        property: "og:title",
        content: "FlipNosh — Branded direct ordering for restaurants",
      },
      {
        property: "og:description",
        content:
          "Take back your margin and your customers from delivery marketplaces.",
      },
    ],
  }),
  component: Marketing,
});

// ─── Section wrappers that wire up scroll-reveal ──────────────────────────────

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// ─── Marketing page ────────────────────────────────────────────────────────────

function Marketing() {
  const plans = [
    PLAN_DEFINITIONS.starter,
    PLAN_DEFINITIONS.growth,
    PLAN_DEFINITIONS.pro,
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Flame className="h-4 w-4" />
            </span>
            <span className="font-bold text-lg">FlipNosh</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-7 text-sm text-muted-foreground">
            <Link to="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link
              to="/r/$slug"
              params={{ slug: "naturalfingers" }}
              className="hover:text-foreground transition-colors"
            >
              Demo
            </Link>
            <Link to="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </nav>
          <Link
            to="/signup"
            className="btn-shimmer glow-primary rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Start free trial
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════ HERO */}
      <section className="relative overflow-hidden">
        {/* Animated gradient mesh background */}
        <div
          className="absolute inset-0 animate-gradient-shift pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.62 0.19 35 / 12%) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 80%, oklch(0.78 0.14 75 / 10%) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 50%, oklch(0.72 0.18 55 / 8%) 0%, transparent 70%)",
          }}
        />

        {/* Subtle dot grid */}
        <div className="absolute inset-0 bg-dots opacity-60 pointer-events-none" />

        {/* Floating orbs */}
        <div
          className="absolute top-20 right-[8%] h-56 w-56 rounded-full animate-float pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.19 35 / 18%) 0%, transparent 70%)",
            filter: "blur(32px)",
          }}
        />
        <div
          className="absolute top-40 left-[5%] h-72 w-72 rounded-full animate-float-b pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.14 75 / 14%) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-48 w-[600px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, oklch(0.62 0.19 35 / 10%) 0%, transparent 70%)",
            filter: "blur(48px)",
          }}
        />

        {/* Hero content */}
        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-28 text-center">
          <div className="animate-in fade-in slide-in-from-bottom duration-700 fill-mode-both">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/15 transition-colors mb-8"
            >
              <Zap className="h-3.5 w-3.5" />
              30-day free trial · No card required
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom duration-700 delay-100 fill-mode-both text-5xl sm:text-7xl font-bold tracking-tight leading-[1.04]">
            Stop paying{" "}
            <span
              className="relative inline-block"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.62 0.19 35) 0%, oklch(0.72 0.20 55) 50%, oklch(0.62 0.19 35) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              30%
            </span>{" "}
            to
            <br className="hidden sm:block" /> Deliveroo.
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom duration-700 delay-200 fill-mode-both mt-7 mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            FlipNosh gives independent restaurants their own branded
            direct-ordering storefront. Own your customers. Keep your margins.
            No commission on a single order.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-300 fill-mode-both mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="btn-shimmer glow-primary inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Start free trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/r/$slug"
              params={{ slug: "naturalfingers" }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-7 py-3.5 text-base font-semibold hover:bg-muted transition-colors"
            >
              <Star className="h-4 w-4 text-primary" />
              See live demo
            </Link>
          </div>

          <p className="animate-in fade-in duration-700 delay-500 fill-mode-both mt-5 text-sm text-muted-foreground">
            Plans from{" "}
            <strong className="text-foreground font-semibold">£79/month</strong>{" "}
            · cancel any time
          </p>

          {/* Floating feature badges */}
          <div className="animate-in fade-in duration-1000 delay-700 fill-mode-both mt-14 flex flex-wrap justify-center gap-2.5">
            {[
              "Branded storefront",
              "QR campaigns",
              "Zero commission",
              "Direct payments",
              "Customer database",
              "Live order dashboard",
            ].map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm"
              >
                <Check className="h-3 w-3 text-primary" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ STATS BAR */}
      <RevealSection className="border-y border-border bg-card/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "30%", label: "Average marketplace fee", negative: true },
            { value: "£0", label: "Commission on FlipNosh orders", positive: true },
            { value: "30 days", label: "Free trial, no card needed", positive: true },
            { value: "< 1hr", label: "Average time to go live", positive: true },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`reveal reveal-delay-${i + 1} space-y-1`}
            >
              <p
                className={`text-3xl sm:text-4xl font-bold ${
                  stat.negative
                    ? "text-destructive"
                    : stat.positive
                    ? "text-primary"
                    : "text-foreground"
                }`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════════════════ PROBLEM */}
      <RevealSection className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <div className="reveal inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive mb-5">
              <TrendingDown className="h-3.5 w-3.5" />
              The problem with marketplaces
            </div>
            <h2 className="reveal reveal-delay-1 text-4xl font-bold leading-snug">
              They take your revenue{" "}
              <span className="text-destructive">and</span> your customers.
            </h2>
            <p className="reveal reveal-delay-2 mt-5 text-muted-foreground leading-relaxed text-lg">
              Delivery apps charge 25–35% per order, hide your customer's
              contact details, and rank you against your competitors. You do the
              cooking. They keep the relationship.
            </p>
            <div className="reveal reveal-delay-3 mt-8 space-y-3">
              {[
                "Your customer data belongs to the marketplace",
                "Commission eats your margin on every single order",
                "You can't market to customers who order through them",
                "They can de-list you or raise fees at any time",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm">
                  <div className="mt-1 h-4 w-4 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  </div>
                  <span className="text-muted-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Problem visual */}
          <div className="reveal reveal-delay-2 grid gap-4">
            {[
              {
                label: "Monthly GMV",
                value: "£10,000",
                sub: "typical independent",
                color: "bg-muted",
              },
              {
                label: "Marketplace commission",
                value: "−£3,000",
                sub: "at 30% per order",
                color: "bg-destructive/8",
                highlight: true,
              },
              {
                label: "FlipNosh Starter plan",
                value: "£79",
                sub: "flat monthly, zero commission",
                color: "bg-primary/8",
                positive: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className={`card-glow rounded-2xl border p-5 flex items-center justify-between ${
                  row.highlight
                    ? "border-destructive/30 bg-destructive/5"
                    : row.positive
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div>
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {row.sub}
                  </p>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    row.highlight
                      ? "text-destructive"
                      : row.positive
                      ? "text-primary"
                      : "text-foreground"
                  }`}
                >
                  {row.value}
                </p>
              </div>
            ))}
            <p className="text-center text-sm text-muted-foreground pt-1">
              That's{" "}
              <strong className="text-foreground">£35,000+ saved every year</strong>{" "}
              for a restaurant doing £10k/month in online orders.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════════════════ SOLUTION */}
      <RevealSection className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center mb-16">
            <div className="reveal inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary mb-5">
              <TrendingUp className="h-3.5 w-3.5" />
              The FlipNosh solution
            </div>
            <h2 className="reveal reveal-delay-1 text-4xl sm:text-5xl font-bold">
              Your own branded{" "}
              <span className="text-gradient">ordering storefront.</span>
            </h2>
            <p className="reveal reveal-delay-2 mt-5 mx-auto max-w-xl text-muted-foreground text-lg">
              Beautiful, mobile-first, and entirely yours. Customers order
              direct. Payment lands straight in your bank. You keep their
              details.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Store,
                title: "Branded storefront",
                desc: "Your menu, your photos, your colors. Mobile-first ordering that feels like your brand, not a marketplace.",
                delay: 1,
              },
              {
                icon: QrCode,
                title: "QR campaigns",
                desc: "Table tents, takeaway bags, window stickers. Track scans and conversions from every placement.",
                delay: 2,
              },
              {
                icon: Users,
                title: "Customer database",
                desc: "Own every order's email and phone number. Build the direct marketing list marketplaces will never give you.",
                delay: 3,
              },
              {
                icon: CreditCard,
                title: "Zero commission payments",
                desc: "Customer payments via Stripe go straight to your bank. FlipNosh never touches your revenue.",
                delay: 4,
              },
              {
                icon: LayoutDashboard,
                title: "Live order dashboard",
                desc: "Live order feed, prep stages, and daily revenue. Built for service, not spreadsheets.",
                delay: 5,
              },
              {
                icon: Flame,
                title: "Built for independents",
                desc: "Not a marketplace. Not a POS. The direct channel marketplaces don't want you to have.",
                delay: 6,
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`reveal reveal-delay-${f.delay} card-glow rounded-2xl border border-border bg-card p-7 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5`}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold text-base">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="reveal reveal-delay-3 mt-10 text-center">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              See all features in detail <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════════════════ PRICING */}
      <RevealSection className="mx-auto max-w-5xl px-6 py-24">
        <div className="text-center mb-14">
          <div className="reveal inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-5">
            <Zap className="h-3.5 w-3.5" />
            Simple, flat-rate pricing
          </div>
          <h2 className="reveal reveal-delay-1 text-4xl sm:text-5xl font-bold">
            One monthly fee.
            <br />
            <span className="text-gradient">Zero commission.</span>
          </h2>
          <p className="reveal reveal-delay-2 mt-5 text-muted-foreground text-lg max-w-xl mx-auto">
            Every FlipNosh order keeps 100% of its revenue with you. No
            percentage, no per-order fee, no surprises.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div
              key={plan.id}
              className={`reveal reveal-delay-${i + 1} relative card-glow rounded-2xl border flex flex-col p-7 transition-all duration-300 hover:-translate-y-1 ${
                plan.recommended
                  ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-border bg-card hover:shadow-lg hover:shadow-primary/5"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="font-bold text-lg">{plan.name}</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-4xl font-bold">
                    {plan.monthlyPriceDisplay}
                  </span>
                  <span className="text-muted-foreground text-sm pb-1">
                    /mo
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.highlights.slice(0, 5).map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
                {plan.highlights.length > 5 && (
                  <li className="text-xs text-muted-foreground pl-[26px]">
                    + {plan.highlights.length - 5} more
                  </li>
                )}
              </ul>

              <Link
                to="/signup"
                className={`btn-shimmer rounded-full py-2.5 text-center text-sm font-semibold transition-all ${
                  plan.recommended
                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                    : "border border-border hover:bg-muted"
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        <div className="reveal reveal-delay-3 text-center mt-8 space-y-2">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            See full pricing & feature comparison{" "}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="text-xs text-muted-foreground">
            All plans · 30-day free trial · No credit card · Cancel any time
          </p>
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════════════════ TRUST */}
      <RevealSection className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-16 grid gap-8 sm:grid-cols-3 text-center">
          {[
            {
              icon: ShieldCheck,
              title: "GDPR compliant",
              desc: "Your customer data stays yours. We never sell or share it.",
            },
            {
              icon: Zap,
              title: "Same-day launch",
              desc: "Complete onboarding and your storefront is live in under an hour.",
            },
            {
              icon: CreditCard,
              title: "Stripe-backed payments",
              desc: "Industry-leading checkout. Apple Pay, Google Pay, all cards.",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className={`reveal reveal-delay-${i + 1} flex flex-col items-center gap-3`}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <item.icon className="h-6 w-6" />
              </div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* ═══════════════════════════════════════════════════════ CTA */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 animate-gradient-shift pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at 50% 50%, oklch(0.62 0.19 35 / 10%) 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <RevealSection>
            <div className="reveal inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Flame className="h-3.5 w-3.5" />
              Join restaurants taking back their margin
            </div>
            <h2 className="reveal reveal-delay-1 text-4xl sm:text-5xl font-bold leading-tight">
              Ready to own
              <br />
              <span className="text-gradient">your customers?</span>
            </h2>
            <p className="reveal reveal-delay-2 mt-5 text-muted-foreground text-lg max-w-xl mx-auto">
              30-day free trial. No credit card. Your branded storefront can be
              live today.
            </p>
            <div className="reveal reveal-delay-3 mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="btn-shimmer glow-primary inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                Launch your storefront <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:hello@flipnosh.com"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-sm px-8 py-4 text-base font-semibold hover:bg-muted transition-colors"
              >
                Book a demo
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Flame className="h-3 w-3" />
            </span>
            <span className="font-semibold text-foreground">FlipNosh</span>
            <span className="text-border">·</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a
              href="mailto:hello@flipnosh.com"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
