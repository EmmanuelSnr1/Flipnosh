import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { mockCustomers } from "@/lib/mock-data/customers";
import { gbp } from "@/lib/format";

export const Route = createFileRoute("/dashboard/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" subtitle="Own the relationship — no marketplace in the middle." />
      <div className="p-6">
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
              {mockCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-muted/50">
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <div>{c.email}</div>
                    <div className="text-xs">{c.phone}</div>
                  </td>
                  <td className="px-5 py-3 text-right">{c.orders}</td>
                  <td className="px-5 py-3 text-right font-semibold">{gbp(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{c.lastOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}