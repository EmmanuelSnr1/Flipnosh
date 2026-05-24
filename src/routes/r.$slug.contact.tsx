import { createFileRoute, notFound } from "@tanstack/react-router";
import { store, useStore } from "@/stores/mock-store";
import type { Restaurant } from "@/types";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { MapPin, Phone, Mail, Clock, Truck, ShoppingBag, Instagram, Facebook } from "lucide-react";

export const Route = createFileRoute("/r/$slug/contact")({
  loader: ({ params }) => {
    const r = store.getRestaurant(params.slug);
    if (!r) throw notFound();
    return { slug: params.slug };
  },
  component: ContactPage,
});

function ContactPage() {
  const { slug } = Route.useLoaderData();
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === slug) as Restaurant;
  const { theme, branding } = r;

  return (
    <StorefrontShell restaurant={r}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold">Visit & contact</h1>
        <p className="mt-2 text-muted-foreground">{branding.tagline}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Info icon={MapPin} label="Address">
              {r.address}<br />{r.postcode}
            </Info>
            {theme.showPhone && (
              <Info icon={Phone} label="Phone">
                <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a>
              </Info>
            )}
            {theme.showEmail && branding.email && (
              <Info icon={Mail} label="Email">
                <a href={`mailto:${branding.email}`} className="hover:underline">{branding.email}</a>
              </Info>
            )}
            <Info icon={Clock} label="Hours">
              {r.hours}
            </Info>
            <Info icon={ShoppingBag} label="Fulfilment">
              {r.pickupEnabled && "Pickup"} {r.pickupEnabled && r.deliveryEnabled && "·"} {r.deliveryEnabled && "Delivery"}
            </Info>
            {theme.showDeliveryAreas && branding.deliveryAreas && branding.deliveryAreas.length > 0 && (
              <Info icon={Truck} label="Delivery areas">
                {branding.deliveryAreas.join(", ")}
              </Info>
            )}
            {theme.showSocialLinks && branding.socials && (
              <div className="flex gap-2 pt-2">
                {branding.socials.instagram && (
                  <a className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">
                    <Instagram className="h-4 w-4" /> {branding.socials.instagram}
                  </a>
                )}
                {branding.socials.facebook && (
                  <a className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">
                    <Facebook className="h-4 w-4" /> {branding.socials.facebook}
                  </a>
                )}
              </div>
            )}
          </div>

          {theme.showMap && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-sm">
                <div className="text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Map placeholder<br />
                  <span className="text-xs">{r.address}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StorefrontShell>
  );
}

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm mt-0.5">{children}</p>
      </div>
    </div>
  );
}