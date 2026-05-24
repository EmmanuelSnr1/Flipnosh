import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABEL,
  store,
  useStore,
} from "@/stores/mock-store";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { gbp } from "@/lib/utils/format";
import type { Order, OrderStatus } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
});

type Filter = "active" | "completed" | "rejected" | "all";

const ACTIVE: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

function OrdersPage() {
  const { orders } = useStore();
  const [filter, setFilter] = useState<Filter>("active");

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return ACTIVE.includes(o.status);
    if (filter === "completed") return o.status === "completed";
    return o.status === "rejected";
  });

  const counts: Record<Filter, number> = {
    active: orders.filter((o) => ACTIVE.includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    rejected: orders.filter((o) => o.status === "rejected").length,
    all: orders.length,
  };

  const update = (o: Order, status: OrderStatus) => {
    store.updateOrderStatus(o.id, status);
    if (status === "rejected") toast.error(`${o.number} rejected`);
    else toast.success(`${o.number} → ${ORDER_STATUS_LABEL[status]}`);
  };

  return (
    <>
      <PageHeader title="Orders" subtitle="Update status as orders move through the kitchen." />
      <div className="p-6 space-y-4">
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

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No orders to show.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} onUpdate={update} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function OrderCard({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (o: Order, s: OrderStatus) => void;
}) {
  const nextStatuses = ORDER_STATUS_FLOW[order.status];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{order.number}</h3>
            <OrderStatusBadge status={order.status} />
            <span className="text-xs text-muted-foreground capitalize">· {order.type}</span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {order.customer} · {order.phone} · {order.createdAt}
          </p>
        </div>
        <span className="text-lg font-bold">{gbp(order.total)}</span>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {order.items.map((it, idx) => (
          <li key={idx}>
            {it.quantity} × <span className="text-foreground">{it.name}</span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs italic text-muted-foreground">
          Note: {order.notes}
        </p>
      )}

      {nextStatuses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((s) => {
            const isReject = s === "rejected";
            return (
              <button
                key={s}
                onClick={() => onUpdate(order, s)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isReject
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isReject ? "Reject" : `Mark ${ORDER_STATUS_LABEL[s]}`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}