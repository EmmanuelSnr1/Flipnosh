import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as SlugRoute } from "@/routes/r.$slug";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/r/$slug/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s.order === "string" ? s.order : undefined,
    name:  typeof s.name  === "string" ? s.name  : undefined,
    type:  s.type === "delivery" ? ("delivery" as const) : ("pickup" as const),
    track: typeof s.track === "string" ? s.track : undefined,
  }),
  loader: () => ({}),
  component: SuccessPage,
});

function SuccessPage() {
  const { restaurant } = SlugRoute.useLoaderData();
  const { order, name, type, track } = Route.useSearch();
  const orderNumber = order ?? "—";

  const prepTime =
    type === "delivery"
      ? (restaurant.fulfilment.delivery.etaMinutes ?? 45)
      : (restaurant.fulfilment.pickup.prepTimeMinutes ?? 20);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center rounded-3xl border border-border bg-card p-8 shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold">Order placed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {name ? `Thanks ${name}` : "Thanks"} —{" "}
          <span className="font-medium text-foreground">{restaurant.name}</span>{" "}
          has received your order{" "}
          <span className="font-medium text-foreground">{orderNumber}</span>.
        </p>

        <div className="mt-6 rounded-2xl bg-muted p-4 text-left text-sm space-y-3">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Fulfilment</p>
            <p className="font-medium capitalize">{type}</p>
          </div>

          {type === "pickup" && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Pickup address</p>
              <p className="font-medium">
                {restaurant.address}, {restaurant.postcode}
              </p>
            </div>
          )}

          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
              Estimated {type === "pickup" ? "ready time" : "delivery time"}
            </p>
            <p className="font-medium">~{prepTime} minutes</p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">Payment</p>
            <p className="font-medium">
              Pay on {type === "pickup" ? "collection" : "delivery"} · cash or card
            </p>
          </div>
        </div>

        {/* Track order link */}
        {track && (
          <Link
            to="/track/$token"
            params={{ token: track }}
            className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Track your order →
          </Link>
        )}

        <Link
          to="/r/$slug/menu"
          params={{ slug: restaurant.slug }}
          className={`${track ? "mt-3" : "mt-6"} inline-block rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted`}
        >
          Back to menu
        </Link>
      </div>
    </div>
  );
}
