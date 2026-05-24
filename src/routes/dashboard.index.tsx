import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useStore } from "@/stores/mock-store";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { gbp } from "@/lib/utils/format";
import { TrendingUp, Receipt, Users, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const { orders, customers } = useStore();
  const earning = orders.filter((o) => o.status !== "rejected");
  const revenue = earning.reduce((s, o) => s + o.total, 0);
  const activeOrders = orders.filter((o) =>
    ["pending", "accepted", "preparing", "ready"].includes(o.status),
  );
  const stats = [
    { label: "Revenue today", value: gbp(revenue), icon: TrendingUp, change: "+18%" },
    { label: "Orders today", value: earning.length, icon: Receipt, change: `${activeOrders.length} active` },
    { label: "Customers", value: customers.length, icon: Users, change: "+3" },
    { label: "Avg prep time", value: "14 min", icon: Clock, change: "-2 min" },
  ];
  return (
    <>
      <PageHeader title="Overview" subtitle="What's happening at Natural Fingers today." />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.change}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Live orders</h2>
          </div>
          <div className="divide-y divide-border">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{o.number} · {o.customer}</p>
                  <p className="text-xs text-muted-foreground">{o.items.length} items · {o.type} · {o.createdAt}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-semibold">{gbp(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}