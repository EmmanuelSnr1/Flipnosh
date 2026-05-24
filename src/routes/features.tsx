import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Flame,
  Store,
  QrCode,
  Users,
  CreditCard,
  LayoutDashboard,
  Palette,
  BarChart3,
  Megaphone,
  Globe,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — FlipNosh" },
      {
        name: "description",
        content:
          "Everything your restaurant needs to take back direct orders from delivery marketplaces.",
      },
    ],
  }),
  component: FeaturesPage,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

type FeatureGroup = {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  headline: string;
  description: string;
  points: string[];
};

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    label: "Storefront",
    icon: Store,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    headline: "A storefront that's 100% yours",
    description:
      "Your branded ordering page lives at flipnosh.com/r/yourname. Customize every detail — your colors, photos, menu layout, and theme.",
    points: [
      "Mobile-first, fast-loading storefront",
      "Full branding: logo, colors, typography",
      "Multiple page layouts and themes",
      "Custom hero images and category art",
      "Enabled/disabled pages per plan",
    ],
  },
  {
    label: "Orders",
    icon: LayoutDashboard,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    headline: "Real-time order management",
    description:
      "Receive orders instantly in a live dashboard. Move them through prep stages and track daily revenue — all in one place.",
    points: [
      "Live order feed with push updates",
      "Pickup and delivery fulfilment",
      "Order prep stage workflow",
      "Customer notes and special requests",
      "Daily revenue and order summaries",
    ],
  },
  {
    label: "Payments",
    icon: CreditCard,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    headline: "Stripe-powered, zero commission",
    description:
      "Customer payments go directly into your Stripe account. FlipNosh never holds your money. No per-order fee — just your flat subscription.",
    points: [
      "Stripe Checkout for customers",
      "Direct payouts to your bank",
      "Apple Pay and Google Pay supported",
      "No commission on any order",
      "Refunds handled in your Stripe dashboard",
    ],
  },
  {
    label: "QR Campaigns",
    icon: QrCode,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    headline: "Turn offline customers into online ones",
    description:
      "Create QR codes for table cards, takeaway bags, receipts, and stickers. Track exactly where your direct orders come from.",
    points: [
      "Unlimited QR campaigns",
      "Named sources (e.g. 'Table card', 'Bag insert')",
      "Scan and conversion tracking",
      "Downloadable QR assets",
      "UTM-style source attribution",
    ],
  },
  {
    label: "Customers",
    icon: Users,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    headline: "Own your customer database",
    description:
      "Every customer who orders directly is yours. Build a real marketing list with real contact details — not locked away in a marketplace.",
    points: [
      "Full customer contact records",
      "Order history per customer",
      "Lifetime value tracking",
      "Customer segmentation (Growth+)",
      "Export-ready CSV downloads",
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    headline: "Know what's working",
    description:
      "From daily revenue trends to bestselling items, understand your direct channel at a glance.",
    points: [
      "Revenue and order trends",
      "Top-selling items",
      "QR scan-to-order conversion funnels",
      "Customer acquisition tracking",
      "Advanced cohort analysis (Growth+)",
    ],
  },
  {
    label: "Marketing",
    icon: Megaphone,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    headline: "Loyalty, offers, and automation",
    description:
      "Reward returning customers, run targeted promotions, and automate win-back campaigns — features marketplaces will never give you.",
    points: [
      "Discount codes and limited-time offers",
      "Loyalty stamp cards",
      "Automated re-engagement emails",
      "Segment-based campaigns",
      "Available on Growth and Pro plans",
    ],
  },
  {
    label: "Branding",
    icon: Palette,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    headline: "Look as good as you taste",
    description:
      "Full theme control, multiple layouts, and a no-code editor that makes your storefront polished on any device.",
    points: [
      "1 theme on Starter, unlimited on Growth+",
      "Hero layouts: image, video, split",
      "Menu layouts: list, grid, cards",
      "Custom CTA text and sections",
      "Dark mode support",
    ],
  },
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    label: "GDPR compliant",
    desc: "You own your customer data. We never sell or share it.",
  },
  {
    icon: Globe,
    label: "99.9% uptime SLA",
    desc: "Hosted on Cloudflare's edge — fast and reliable everywhere.",
  },
  {
    icon: Zap,
    label: "Same-day onboarding",
    desc: "Your storefront can be live within hours of signing up.",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function FeatureRow({
  group,
  index,
}: {
  group: FeatureGroup;
  index: number;
}) {
  const ref = useInView<HTMLDivElement>();
  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`grid gap-12 md:grid-cols-2 items-center ${
        isEven ? "" : "md:[&>*:first-child]:order-2"
      }`}
    >
      {/* Text side */}
      <div>
        <div
          className={`reveal reveal-delay-1 inline-flex items-center gap-2 rounded-full ${group.bg} px-3 py-1.5 text-sm font-medium ${group.color} mb-4`}
        >
          <group.icon className="h-4 w-4" />
          {group.label}
        </div>
        <h2 className="reveal reveal-delay-2 text-3xl font-bold leading-snug">
          {group.headline}
        </h2>
        <p className="reveal reveal-delay-3 mt-4 text-muted-foreground leading-relaxed">
          {group.description}
        </p>
        <ul className="reveal reveal-delay-4 mt-6 space-y-2.5">
          {group.points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Visual card side */}
      <div
        className={`reveal reveal-delay-2 card-glow rounded-3xl border border-border bg-card p-10 flex flex-col items-center justify-center min-h-[280px] ${group.bg}`}
      >
        <div
          className={`inline-flex h-20 w-20 items-center justify-center rounded-2xl ${group.bg} border border-border/50`}
        >
          <group.icon className={`h-10 w-10 ${group.color}`} />
        </div>
        <p className="mt-5 text-lg font-semibold text-center">{group.label}</p>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">
          {group.description.split(".")[0]}.
        </p>
      </div>
    </div>
  );
}

function TrustStrip() {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="grid gap-8 sm:grid-cols-3">
      {TRUST_ITEMS.map((item, i) => (
        <div
          key={item.label}
          className={`reveal reveal-delay-${i + 1} flex flex-col items-center text-center gap-3`}
        >
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <item.icon className="h-6 w-6" />
          </div>
          <p className="font-semibold">{item.label}</p>
          <p className="text-sm text-muted-foreground">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function FeaturesPage() {
  const heroRef = useInView<HTMLElement>();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/90">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-4 w-4" />
            </span>
            <span className="font-bold text-lg">FlipNosh</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <Link to="/features" className="text-foreground font-medium">
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/r/$slug"
              params={{ slug: "naturalfingers" }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Demo
            </Link>
            <Link
              to="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          </div>
          <Link
            to="/signup"
            className="btn-shimmer inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Start free trial
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center"
      >
        <div className="reveal inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Zap className="h-3.5 w-3.5" />
          Everything in one platform
        </div>
        <h1 className="reveal reveal-delay-1 text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
          Built for restaurants,
          <br />
          <span className="text-gradient">not marketplaces.</span>
        </h1>
        <p className="reveal reveal-delay-2 mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Every feature FlipNosh ships is designed to help you build a direct
          customer relationship — the one thing Deliveroo and Uber Eats will
          never let you have.
        </p>
        <div className="reveal reveal-delay-3 mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="btn-shimmer glow-primary inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* ── Feature rows ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24 space-y-24">
        {FEATURE_GROUPS.map((group, i) => (
          <FeatureRow key={group.label} group={group} index={i} />
        ))}
      </section>

      {/* ── Trust strip ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <TrustStrip />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to own your customers?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          30-day free trial. No credit card. Cancel any time. Your storefront
          can be live today.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="btn-shimmer glow-primary rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Launch your storefront
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
          >
            Compare plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 FlipNosh. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link to="/features" className="hover:text-foreground">
              Features
            </Link>
            <Link to="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
            <a href="mailto:hello@flipnosh.com" className="hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
