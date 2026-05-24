import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Receipt, UtensilsCrossed, Users, QrCode, CreditCard, Settings, Palette,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { useStore } from "@/stores/mock-store";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/orders", label: "Orders", icon: Receipt },
  { to: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/dashboard/storefront", label: "Storefront", icon: Palette },
  { to: "/dashboard/customers", label: "Customers", icon: Users },
  { to: "/dashboard/campaigns", label: "QR campaigns", icon: QrCode },
  { to: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { restaurants } = useStore();
  const nf = restaurants.find((r) => r.slug === "naturalfingers");
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-5 py-5 flex items-center gap-3">
        <Logo size="sm" showWordmark={false} />
        <div>
          <p className="text-sm font-bold leading-tight">FlipNosh</p>
          <p className="text-xs text-muted-foreground leading-tight">{nf?.name ?? ""}</p>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to as "/dashboard"}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="rounded-xl bg-muted p-3 text-xs">
          <p className="font-medium text-foreground">Pilot plan</p>
          <p className="mt-0.5 text-muted-foreground">Free until launch</p>
        </div>
      </div>
    </aside>
  );
}