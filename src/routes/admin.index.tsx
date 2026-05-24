import { createFileRoute, Link } from "@tanstack/react-router";
import { allRestaurants } from "@/lib/mock-data/restaurants";

export const Route = createFileRoute("/admin/")({
  component: AdminList,
});

function AdminList() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-bold">Restaurants</h1>
      <p className="text-sm text-muted-foreground mt-1">{allRestaurants.length} on platform</p>
      <div className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-5 py-3 text-left">Restaurant</th>
              <th className="px-5 py-3 text-left">City</th>
              <th className="px-5 py-3 text-left">Onboarding</th>
              <th className="px-5 py-3 text-left">Subscription</th>
              <th className="px-5 py-3 text-left">Stripe Connect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allRestaurants.map((r) => (
              <tr key={r.id} className="hover:bg-muted/50">
                <td className="px-5 py-3">
                  <Link to="/admin/$id" params={{ id: r.id }} className="font-medium hover:text-primary">{r.name}</Link>
                  <p className="text-xs text-muted-foreground">/r/{r.slug}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{r.city}</td>
                <td className="px-5 py-3">
                  <Badge variant={r.onboardingComplete ? "good" : "warn"}>
                    {r.onboardingComplete ? "Complete" : "In progress"}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={r.subscriptionStatus === "active" ? "good" : r.subscriptionStatus === "past_due" ? "bad" : "neutral"}>
                    {r.subscriptionStatus}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge variant={r.stripeConnected ? "good" : "warn"}>
                    {r.stripeConnected ? "Connected" : "Not connected"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ variant, children }: { variant: "good" | "warn" | "bad" | "neutral"; children: React.ReactNode }) {
  const map = {
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    bad: "bg-red-100 text-red-700",
    neutral: "bg-zinc-100 text-zinc-700",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[variant]}`}>{children}</span>;
}