/**
 * /track/$token — Public order tracking page.
 *
 * No login required. Accessible to customers via the link on their
 * receipt / success page.
 *
 * - Loads initial data server-side via loader
 * - Polls every 12 s client-side for status updates
 * - Shows restaurant branding, order timeline, items, payment status
 * - Handles: not-found, rejected, payment-failed, completed states
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ChefHat,
  Package,
  Truck,
  ShoppingBag,
} from "lucide-react";
import {
  getOrderTrackingByToken,
  type OrderTrackingResult,
} from "@/api/order-tracking";
import { gbp } from "@/lib/utils/format";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/track/$token")({
  loader: async ({ params: { token } }) =>
    getOrderTrackingByToken({ data: token }),
  component: TrackingPage,
});

// ─── Status helpers ───────────────────────────────────────────────────────────

type StatusStep = {
  key: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PICKUP_STEPS: StatusStep[] = [
  { key: "pending",   label: "Order received",             sublabel: "Waiting for restaurant",     icon: ShoppingBag },
  { key: "accepted",  label: "Order accepted",             sublabel: "Restaurant confirmed it",     icon: CheckCircle2 },
  { key: "preparing", label: "Being prepared",             sublabel: "Kitchen is on it",            icon: ChefHat },
  { key: "ready",     label: "Ready for collection",       sublabel: "Come pick it up!",            icon: Package },
  { key: "completed", label: "Order complete",             sublabel: "Enjoy!",                      icon: CheckCircle2 },
];

const DELIVERY_STEPS: StatusStep[] = [
  { key: "pending",   label: "Order received",             sublabel: "Waiting for restaurant",     icon: ShoppingBag },
  { key: "accepted",  label: "Order accepted",             sublabel: "Restaurant confirmed it",     icon: CheckCircle2 },
  { key: "preparing", label: "Being prepared",             sublabel: "Kitchen is on it",            icon: ChefHat },
  { key: "ready",     label: "Out for delivery",           sublabel: "On its way to you!",          icon: Truck },
  { key: "completed", label: "Order delivered",            sublabel: "Enjoy!",                      icon: CheckCircle2 },
];

const STATUS_ORDER = ["pending", "accepted", "preparing", "ready", "completed"];

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ─── Poll interval ────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 12_000;
const TERMINAL_STATUSES = new Set(["completed", "rejected"]);
const TERMINAL_PAYMENT  = new Set(["paid", "failed", "cancelled"]);

// ─── Page component ───────────────────────────────────────────────────────────

function TrackingPage() {
  const token       = Route.useParams().token;
  const initial     = Route.useLoaderData() as OrderTrackingResult;
  const [data, setData] = useState<OrderTrackingResult>(initial);

  // ── Polling for live updates ─────────────────────────────────────────────
  useEffect(() => {
    if (!data.found) return; // Nothing to poll for
    if (
      TERMINAL_STATUSES.has((data as Extract<OrderTrackingResult, { found: true }>).status) &&
      TERMINAL_PAYMENT.has((data as Extract<OrderTrackingResult, { found: true }>).paymentStatus)
    ) {
      return; // Both status and payment are terminal — stop polling
    }

    const id = setInterval(async () => {
      try {
        const fresh = await getOrderTrackingByToken({ data: token });
        setData(fresh);
      } catch {
        // Swallow — keep showing last known state
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [token, data]);

  // ── Not found ────────────────────────────────────────────────────────────
  if (!data.found) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-6">
          <XCircle className="h-14 w-14 text-muted-foreground" />
          <h1 className="text-xl font-bold">Order not found</h1>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            This tracking link is invalid or has expired. Check your receipt for
            the correct link.
          </p>
        </div>
      </Shell>
    );
  }

  const order = data;

  return (
    <Shell
      restaurantName={order.restaurantName}
      restaurantLogoUrl={order.restaurantLogoUrl}
    >
      {/* ── Order header ── */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Order
        </p>
        <h2 className="text-lg font-bold mt-0.5">{order.orderNumber}</h2>
        {order.orderName && order.orderName !== order.orderNumber && (
          <p className="text-sm text-muted-foreground">{order.orderName}</p>
        )}
      </div>

      {/* ── Rejected state ── */}
      {order.status === "rejected" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <XCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="font-semibold text-destructive">Order cancelled</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unfortunately the restaurant could not fulfil this order.
          </p>
          <Link
            to="/r/$slug"
            params={{ slug: order.restaurantSlug }}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Return to menu →
          </Link>
        </div>
      )}

      {/* ── Payment failed state ── */}
      {order.status !== "rejected" && order.paymentStatus === "failed" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <XCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="font-semibold text-destructive">Payment failed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your payment could not be processed. You have not been charged.
          </p>
          <Link
            to="/r/$slug"
            params={{ slug: order.restaurantSlug }}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Return to menu →
          </Link>
        </div>
      )}

      {/* ── Timeline (for non-terminal states) ── */}
      {order.status !== "rejected" && order.paymentStatus !== "failed" && (
        <StatusTimeline
          status={order.status}
          fulfilmentType={order.fulfilmentType}
        />
      )}

      {/* ── Estimated time ── */}
      {!TERMINAL_STATUSES.has(order.status) &&
        order.status !== "rejected" &&
        order.paymentStatus !== "failed" && (
          <div className="rounded-2xl bg-muted p-4 text-center">
            <Clock className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-sm font-medium">
              Estimated{" "}
              {order.fulfilmentType === "delivery" ? "delivery" : "ready"} time
            </p>
            <p className="text-lg font-bold mt-0.5">
              ~{order.estimatedMinutes} minutes
            </p>
          </div>
        )}

      {/* ── Payment status badge (for Stripe orders) ── */}
      <PaymentBadge status={order.paymentStatus} />

      {/* ── Order items ── */}
      <div className="rounded-2xl border border-border p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          Your order
        </p>
        <ul className="space-y-2">
          {order.items.map((item) => {
            const mods = item.selected_modifiers ?? [];
            return (
              <li key={item.id} className="flex justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium">{item.quantity}×</span>{" "}
                  {item.name}
                  {mods.length > 0 && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({mods.map((m) => m.optionName).join(", ")})
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{gbp(order.totalPence / 100)}</span>
        </div>
      </div>

      {/* ── Fulfilment info ── */}
      <div className="text-center text-xs text-muted-foreground">
        <span className="capitalize font-medium">{order.fulfilmentType}</span>
        {" · "}
        {new Date(order.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {" · "}
        <span className="text-muted-foreground/70">
          Updates every 12 seconds
        </span>
      </div>
    </Shell>
  );
}

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({
  status,
  fulfilmentType,
}: {
  status: string;
  fulfilmentType: string;
}) {
  const steps =
    fulfilmentType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIdx = getStepIndex(status);

  return (
    <ol className="relative">
      {steps.map((step, idx) => {
        const isDone    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <li key={step.key} className="flex gap-4 pb-5 last:pb-0">
            {/* Connector line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/20 bg-transparent text-muted-foreground/30"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`mt-1 w-0.5 flex-1 transition-colors ${
                    isDone ? "bg-primary" : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <div className="pt-1 pb-2">
              <p
                className={`text-sm font-medium leading-tight ${
                  isCurrent
                    ? "text-foreground"
                    : isPending
                      ? "text-muted-foreground/40"
                      : "text-foreground"
                }`}
              >
                {step.label}
                {isCurrent && (
                  <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-primary align-middle animate-pulse" />
                )}
              </p>
              {(isDone || isCurrent) && step.sublabel && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.sublabel}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Payment badge ────────────────────────────────────────────────────────────

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Paid
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
        <Clock className="h-4 w-4" />
        Payment pending
      </div>
    );
  }
  // unpaid (cash), cancelled, failed already handled above
  return null;
}

// ─── Shell layout ─────────────────────────────────────────────────────────────

function Shell({
  children,
  restaurantName,
  restaurantLogoUrl,
}: {
  children: React.ReactNode;
  restaurantName?: string;
  restaurantLogoUrl?: string | null;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5">
        {/* Restaurant branding */}
        {restaurantName && (
          <div className="flex items-center gap-3 justify-center">
            {restaurantLogoUrl && (
              <img
                src={restaurantLogoUrl}
                alt={restaurantName}
                className="h-10 w-10 rounded-xl object-cover"
              />
            )}
            <span className="font-bold text-lg">{restaurantName}</span>
          </div>
        )}

        {children}

        {/* FlipNosh attribution */}
        <p className="text-center text-xs text-muted-foreground/50">
          Powered by FlipNosh
        </p>
      </div>
    </div>
  );
}

// ─── Re-export so the useLoaderData cast is typed correctly ───────────────────
// (TanStack Start infers loader return types automatically)
export { TrackingPage as default };
