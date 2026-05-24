import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { store } from "@/lib/mock-store";
import type { Restaurant } from "@/types";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/r/$slug/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s.order === "string" ? s.order : undefined,
  }),
  loader: ({ params }): { restaurant: Restaurant } => {
    const r = store.getRestaurant(params.slug);
    if (!r) throw notFound();
    return { restaurant: r };
  },
  component: SuccessPage,
});

function SuccessPage() {
  const { restaurant } = Route.useLoaderData() as { restaurant: Restaurant };
  const { order } = Route.useSearch();
  const orderNumber = order ?? `#${Math.floor(1000 + Math.random() * 9000)}`;
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center rounded-3xl border border-border bg-card p-8 shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold">Order placed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks — {restaurant.name} got your order <span className="font-medium text-foreground">{orderNumber}</span>.
          You'll get a text when it's ready.
        </p>
        <div className="mt-6 rounded-2xl bg-muted p-4 text-left text-sm">
          <p className="text-muted-foreground">Address</p>
          <p className="font-medium">{restaurant.address}, {restaurant.postcode}</p>
          <p className="mt-2 text-muted-foreground">Estimated ready time</p>
          <p className="font-medium">~20 minutes</p>
        </div>
        <Link
          to="/r/$slug/menu"
          params={{ slug: restaurant.slug }}
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Back to menu
        </Link>
      </div>
    </div>
  );
}