import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as SlugRoute } from "@/routes/r.$slug";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { gbp } from "@/lib/utils/format";
import { Clock, MapPin, Phone, ArrowRight, Star } from "lucide-react";
import type { Restaurant } from "@/types";

export const Route = createFileRoute("/r/$slug/")({
  // Parent already validated and loaded the restaurant — no work needed here.
  loader: () => ({}),
  head: ({ params }: { params: { slug: string } }) => ({
    meta: [
      { title: `Order online · FlipNosh` },
      { name: "description", content: `Order direct from ${params.slug} on FlipNosh.` },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  // Restaurant data comes from the parent /r/$slug loader — single source of truth.
  const { restaurant: r } = SlugRoute.useLoaderData();
  const { theme, branding } = r;
  const featured = r.menu
    .flatMap((c) => c.items)
    .filter((i) => i.available && i.modifiers !== undefined ? true : true)
    .slice(0, 3);

  return (
    <StorefrontShell restaurant={r}>
      <Hero r={r} />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <div>
            <h2 className="text-2xl font-bold">About {r.name}</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {branding.description}
            </p>
            {theme.showBadges && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {r.pickupEnabled && <Badge>Pickup available</Badge>}
                {r.deliveryEnabled && <Badge>Delivery available</Badge>}
                <Badge>Made to order</Badge>
              </div>
            )}
          </div>
          {theme.showOpeningHours && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" /> Opening hours
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{r.hours}</p>
              <div className="mt-4 border-t border-border pt-4 text-sm space-y-1.5">
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {r.address}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {r.phone}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {theme.showFeaturedItems && featured.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-2xl font-bold">Featured</h2>
            <Link
              to="/r/$slug/menu"
              params={{ slug: r.slug }}
              className="text-sm font-medium text-primary hover:underline"
            >
              See full menu →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {featured.map((it) => (
              <Link
                key={it.id}
                to="/r/$slug/menu"
                params={{ slug: r.slug }}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  <img
                    src={it.image ?? "/food-placeholder.png"}
                    alt={it.name}
                    className={`h-full w-full transition-transform group-hover:scale-105 ${it.image ? "object-cover" : "object-contain p-4 opacity-40"}`}
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold">{it.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {it.description}
                  </p>
                  <p className="mt-2 text-sm font-semibold">{gbp(it.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {theme.showReviews && (
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-12">
          <h2 className="text-2xl font-bold mb-4">What customers say</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex gap-0.5 text-amber-500 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  "Best in town — fast, fresh, and the chicken is unreal."
                </p>
                <p className="mt-3 text-xs font-medium">— Customer {i}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div
          className="rounded-3xl p-8 sm:p-12 text-center"
          style={{ background: theme.primaryColor, color: "white" }}
        >
          <h2 className="text-3xl font-bold">Hungry?</h2>
          <p className="mt-2 opacity-90">Order direct — no third-party fees.</p>
          <Link
            to="/r/$slug/menu"
            params={{ slug: r.slug }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
            style={{ color: theme.primaryColor }}
          >
            {theme.ctaText} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </StorefrontShell>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
      {children}
    </span>
  );
}

function Hero({ r }: { r: Restaurant }) {
  const { theme, branding } = r;
  const image = branding.heroImageUrl ?? r.heroImage;

  if (theme.heroLayout === "minimal") {
    return (
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{r.city}</p>
        <h1 className="mt-3 text-4xl sm:text-6xl font-bold tracking-tight">{r.name}</h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{branding.tagline}</p>
        <Link
          to="/r/$slug/menu"
          params={{ slug: r.slug }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90"
        >
          {theme.ctaText} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  if (theme.heroLayout === "split") {
    return (
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-2 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{r.city}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">{r.name}</h1>
          <p className="mt-4 text-muted-foreground">{branding.tagline}</p>
          <Link
            to="/r/$slug/menu"
            params={{ slug: r.slug }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90"
          >
            {theme.ctaText} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-3xl">
          <img src={image} alt={r.name} className="h-full w-full object-cover" />
        </div>
      </section>
    );
  }

  // Default: image-background hero
  return (
    <section className="relative h-[60vh] min-h-[380px] w-full overflow-hidden">
      <img src={image} alt={r.name} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      <div className="relative z-10 mx-auto h-full max-w-5xl px-4 sm:px-6 flex flex-col justify-end pb-10 text-white">
        {r.openNow && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-current" /> Open now
          </span>
        )}
        <h1 className="mt-3 text-4xl sm:text-6xl font-bold tracking-tight">{r.name}</h1>
        <p className="mt-2 text-white/90 max-w-xl">{branding.tagline}</p>
        <Link
          to="/r/$slug/menu"
          params={{ slug: r.slug }}
          className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-md hover:opacity-90"
          style={{ color: theme.primaryColor }}
        >
          {theme.ctaText} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
