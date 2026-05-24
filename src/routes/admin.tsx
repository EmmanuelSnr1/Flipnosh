import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Flame className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">FlipNosh</p>
              <p className="text-xs text-muted-foreground">Platform admin</p>
            </div>
          </Link>
          <nav className="text-sm text-muted-foreground">
            <span className={pathname === "/admin" ? "text-foreground font-medium" : ""}>Restaurants</span>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}