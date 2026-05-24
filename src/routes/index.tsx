import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Store, QrCode, Users, CreditCard, LayoutDashboard, TrendingDown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FlipNosh — Branded direct ordering for restaurants" },
      { name: "description", content: "Take back your margin and your customers. FlipNosh gives independent restaurants a branded direct ordering storefront in minutes." },
      { property: "og:title", content: "FlipNosh — Branded direct ordering for restaurants" },
      { property: "og:description", content: "Take back your margin and your customers from delivery marketplaces." },
    ],
  }),
  component: Marketing,
});

function Marketing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Flame className="h-4 w-4" /></span>
            <span className="font-bold">FlipNosh</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <Link to="/r/$slug" params={{ slug: "naturalfingers" }} className="hover:text-foreground">Demo storefront</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
          <Link to="/signup" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Join the pilot</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/30 px-3 py-1 text-xs font-medium text-accent-foreground">
          Now in pilot · UK independent restaurants
        </span>
        <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          Your restaurant.<br /><span className="text-primary">Your customers.</span> Direct.
        </h1>
        <p className="mt-5 mx-auto max-w-xl text-base sm:text-lg text-muted-foreground">
          A branded direct ordering storefront for your restaurant. Keep your margin. Own your customer data. No marketplace in the middle.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Join the pilot <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/r/$slug" params={{ slug: "naturalfingers" }} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted">
            See live demo
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-16 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive"><TrendingDown className="h-4 w-4" /> The problem</span>
            <h2 className="mt-2 text-3xl font-bold">Marketplaces take your margin and your customer.</h2>
            <p className="mt-3 text-muted-foreground">
              Delivery apps charge 25–35% per order, hide your customer's contact details, and rank you against your competitors. You do the cooking. They keep the relationship.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { stat: "30%", label: "Marketplace fees per order" },
              { stat: "0", label: "Customer emails you get" },
              { stat: "100%", label: "Risk on your kitchen" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-background p-5 text-center">
                <p className="text-3xl font-bold text-primary">{s.stat}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <span className="text-xs font-medium text-primary">The solution</span>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold">Your own branded ordering storefront.</h2>
        <p className="mt-3 mx-auto max-w-xl text-muted-foreground">
          A beautiful, mobile-first ordering page at <span className="font-mono text-foreground">flipnosh.com/r/yourname</span>. Customers order direct. Payment lands in your bank. You keep their details.
        </p>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Store, title: "Branded storefront", desc: "Your menu, your photos, your colors. Mobile-first ordering that feels like your brand." },
            { icon: QrCode, title: "QR campaigns", desc: "Table tents, takeaway bags, flyers. Track scans and conversions for each placement." },
            { icon: Users, title: "Customer database", desc: "Own every order's email and phone. Build a real direct-marketing list." },
            { icon: CreditCard, title: "Stripe payments", desc: "Payouts straight to your bank via Stripe Connect. FlipNosh never holds your money." },
            { icon: LayoutDashboard, title: "Order dashboard", desc: "Live order feed, prep status, daily revenue. Built for service, not spreadsheets." },
            { icon: Flame, title: "Built for indies", desc: "Not a marketplace. Not a POS. Just the direct channel marketplaces don't want you to have." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Join the pilot.</h2>
          <p className="mt-3 text-muted-foreground">Free for pilot restaurants until launch. We onboard you in person.</p>
          <Link to="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Join the pilot <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 FlipNosh</p>
          <p>Built for independent restaurants.</p>
        </div>
      </footer>
    </div>
  );
}
