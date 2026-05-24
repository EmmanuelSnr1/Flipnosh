import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  getDashboardCustomers,
  dashboardSearch,
  type DashboardCustomer,
} from "@/api/dashboard";
import { gbp } from "@/lib/utils/format";
import { Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/customers")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) => getDashboardCustomers({ data: r! }),
  component: CustomersPage,
});

function CustomersPage() {
  const customers = (Route.useLoaderData() ?? []) as DashboardCustomer[];

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Own the relationship — no marketplace in the middle."
      />
      <div className="p-6">
        {customers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              No customers yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Customers will appear here once orders come in through your
              storefront.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">Spent</th>
                  <th className="px-5 py-3 text-left">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50">
                    <td className="px-5 py-3 font-medium">{c.name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {c.email && <div>{c.email}</div>}
                      {c.phone && (
                        <div className="text-xs">{c.phone}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.total_orders}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {gbp(c.total_spend_pence / 100)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {c.last_order_at
                        ? new Date(c.last_order_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
