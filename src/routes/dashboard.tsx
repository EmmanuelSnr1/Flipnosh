import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getDashboardContext, dashboardSearch } from "@/api/dashboard";

export const Route = createFileRoute("/dashboard")({
  validateSearch: dashboardSearch,

  // beforeLoad has `search` in its context; loader does not — use loaderDeps instead.
  beforeLoad: (ctx) => {
    const r = (ctx as unknown as { search: { r?: string } }).search?.r;
    if (!r) throw redirect({ to: "/login" });
  },

  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),

  loader: async ({ deps: { r } }) => getDashboardContext({ data: r! }),

  component: DashboardLayout,
});

function DashboardLayout() {
  const { restaurant, subscription } = Route.useLoaderData();
  const { r } = Route.useSearch();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        restaurantName={restaurant.name}
        restaurantId={r!}
        subscription={subscription}
      />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
