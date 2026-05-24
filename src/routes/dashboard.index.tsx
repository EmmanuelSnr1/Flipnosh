import { createFileRoute } from "@tanstack/react-router";
import { Route as DashboardRoute } from "./dashboard";
import {
  getDashboardOrders,
  dashboardSearch,
  type DashboardOrder,
  type DashboardContext,
} from "@/api/dashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { gbp } from "@/lib/utils/format";
import { TrendingUp, Receipt, BadgeDollarSign, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) => getDashboardOrders({ data: r! }),
  component: Overview,
});

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "ready"];

function Overview() {
  const orders = (Route.useLoaderData() ?? []) as DashboardOrder[];
  const { restaurant } = DashboardRoute.useLoaderData() as DashboardContext;

  // Exclude rejected orders from revenue
  const earning = orders.filter((o) => o.status !== "rejected");
  const totalRevenuePence = earning.reduce((s, o) => s + o.total_pence, 0);
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "completed");
  // Commission saved ≈ 25% of revenue (vs marketplace)
  const commissionSavedPence = Math.round(totalRevenuePence * 0.25);

  const stats = [
    {
      label: "Revenue today",
      value: gbp(totalRevenuePence / 100),
      icon: TrendingUp,
      change: `${earning.length} paid orders`,
    },
    {
      label: "Active orders",
      value: activeOrders.length,
      icon: Receipt,
      change: `${completedOrders.length} completed`,
    },
    {
      label: "Commission saved",
      value: gbp(commissionSavedPence / 100),
      icon: BadgeDollarSign,
      change: "vs marketplaces",
    },
    {
      label: "Avg prep time",
      value: "—",
      icon: Clock,
      change: "Coming soon",
    },
  ];

  // Live orders = active, most recent first (loader already orders by created_at desc)
  const liveOrders = orders
    .filter((o: DashboardOrder) => ACTIVE_STATUSES.includes(o.status))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={`What's happening at ${restaurant.name} today.`}
      />
      <div className="p-6 space-y-6">
        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.change}</p>
            </div>
          ))}
        </div>

        {/* ── Live orders ── */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Live orders</h2>
          </div>
          {liveOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No active orders right now.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {liveOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {o.order_number} · {o.customer_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.items.length} items · {o.fulfilment_type} ·{" "}
                      {new Date(o.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={o.status as never} />
                    <span className="font-semibold">
                      {gbp(o.total_pence / 100)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
