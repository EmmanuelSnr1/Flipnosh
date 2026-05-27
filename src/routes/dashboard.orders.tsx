import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  getDashboardOrders,
  updateOrderStatus,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  dashboardSearch,
  type DashboardOrder,
} from "@/api/dashboard";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { gbp } from "@/lib/utils/format";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/dashboard/orders")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) => getDashboardOrders({ data: r! }),
  component: OrdersPage,
});

type Filter = "active" | "completed" | "rejected" | "all";
const ACTIVE = ["pending", "accepted", "preparing", "ready"];

// ── Notification beep (Web Audio API — no audio files needed) ─────────────────
function beepNewOrder() {
  try {
    const ctx = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Two-tone ascending beep: 880 Hz → 1100 Hz
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  } catch {
    // Web Audio not available — silent fail
  }
}

// ── Page component ────────────────────────────────────────────────────────────

function OrdersPage() {
  const orders = (Route.useLoaderData() ?? []) as DashboardOrder[];
  const router = useRouter();
  const { r: restaurantId } = Route.useSearch();
  const [filter, setFilter]   = useState<Filter>("active");
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  // ── Supabase Realtime: notify on new incoming orders ──────────────────────
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event:  "INSERT",
          schema: "public",
          table:  "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const num = payload.new.order_number as string | undefined;
          beepNewOrder();
          toast.success("New order!", {
            description: num ? `Order ${num} just came in` : "A new order just came in",
            duration: 8000,
          });
          void router.invalidate();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  // ── Filtering & counts ────────────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    if (filter === "all")       return true;
    if (filter === "active")    return ACTIVE.includes(o.status);
    if (filter === "completed") return o.status === "completed";
    return o.status === "rejected";
  });

  const counts: Record<Filter, number> = {
    active:    orders.filter((o) => ACTIVE.includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    rejected:  orders.filter((o) => o.status === "rejected").length,
    all:       orders.length,
  };

  // ── Status update ─────────────────────────────────────────────────────────
  const update = async (order: DashboardOrder, status: string) => {
    setUpdating((prev) => new Set(prev).add(order.id));
    try {
      await updateOrderStatus({
        data: {
          orderId: order.id,
          status: status as
            | "pending" | "accepted" | "preparing"
            | "ready" | "completed" | "rejected",
        },
      });
      if (status === "rejected") {
        toast.error(`${order.order_number} rejected`);
      } else {
        toast.success(`${order.order_number} → ${ORDER_STATUS_LABEL[status]}`);
      }
      await router.invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order status",
      );
    } finally {
      setUpdating((prev) => {
        const s = new Set(prev);
        s.delete(order.id);
        return s;
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Real-time order management — new orders arrive automatically."
      />
      <div className="p-6 space-y-4">
        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          {(["active", "completed", "rejected", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              <span className={`text-xs ${filter === f ? "opacity-80" : "opacity-60"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Order list ── */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {filter === "active" ? (
              <>
                <p className="font-medium">No active orders right now.</p>
                <p className="mt-1 text-xs">New orders will appear here automatically.</p>
              </>
            ) : (
              <p>No {filter} orders to show.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onUpdate={update}
                isUpdating={updating.has(o.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onUpdate,
  isUpdating,
}: {
  order: DashboardOrder;
  onUpdate: (o: DashboardOrder, s: string) => void;
  isUpdating: boolean;
}) {
  const nextStatuses = ORDER_STATUS_FLOW[order.status] ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{order.order_number}</h3>
            <OrderStatusBadge status={order.status as never} />
            <span className="text-xs text-muted-foreground capitalize">
              · {order.fulfilment_type}
            </span>
            {order.source && (
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                via {order.source}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {order.customer_name}
            {order.customer_phone && ` · ${order.customer_phone}`}
            {" · "}
            {new Date(order.created_at).toLocaleTimeString([], {
              hour:   "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span className="text-lg font-bold">
          {gbp(order.total_pence / 100)}
        </span>
      </div>

      {/* ── Items ── */}
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((it) => {
          const mods = it.selected_modifiers ?? [];
          return (
            <li key={it.id} className="text-muted-foreground">
              <span className="font-medium text-foreground">{it.quantity}×</span>{" "}
              {it.name}
              {mods.length > 0 && (
                <span className="ml-1 text-xs">
                  ({mods.map((m) => m.optionName).join(", ")})
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* ── Notes ── */}
      {order.notes && (
        <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs italic text-muted-foreground">
          Note: {order.notes}
        </p>
      )}

      {/* ── Status actions ── */}
      {nextStatuses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((s) => {
            const isReject = s === "rejected";
            return (
              <button
                key={s}
                disabled={isUpdating}
                onClick={() => onUpdate(order, s)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  isReject
                    ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isUpdating
                  ? "Updating…"
                  : isReject
                    ? "Reject"
                    : `Mark ${ORDER_STATUS_LABEL[s]}`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
