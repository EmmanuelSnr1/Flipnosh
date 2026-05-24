import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { store } from "@/lib/mock-store";
import type { Restaurant } from "@/types";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/admin/$id")({
  loader: ({ params }): { restaurant: Restaurant } => {
    const r = store.getRestaurantById(params.id);
    if (!r) throw notFound();
    return { restaurant: r };
  },
  component: AdminDetail,
});

function AdminDetail() {
  const { restaurant: r } = Route.useLoaderData() as { restaurant: Restaurant };
  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> All restaurants
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{r.name}</h1>
      <p className="text-sm text-muted-foreground">{r.address}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card label="Onboarding" value={r.onboardingComplete ? "Complete" : "In progress"} />
        <Card label="Subscription" value={r.subscriptionStatus} />
        <Card label="Stripe Connect" value={r.stripeConnected ? "Connected" : "Not connected"} />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold">Details</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <Row label="Slug" value={`/r/${r.slug}`} />
          <Row label="City" value={r.city} />
          <Row label="Phone" value={r.phone} />
          <Row label="Hours" value={r.hours} />
          <Row label="Pickup" value={r.pickupEnabled ? "Yes" : "No"} />
          <Row label="Delivery" value={r.deliveryEnabled ? "Yes" : "No"} />
        </dl>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}