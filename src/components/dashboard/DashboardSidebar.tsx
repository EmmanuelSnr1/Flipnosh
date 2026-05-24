import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Receipt,
  UtensilsCrossed,
  Users,
  QrCode,
  CreditCard,
  Settings,
  Palette,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { getRemainingTrialDays } from "@/lib/billing/plans";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/orders", label: "Orders", icon: Receipt },
  { to: "/dashboard/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/dashboard/storefront", label: "Storefront", icon: Palette },
  { to: "/dashboard/customers", label: "Customers", icon: Users },
  { to: "/dashboard/campaigns", label: "QR campaigns", icon: QrCode },
  { to: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { to: "/dashboard/billing", label: "Billing", icon: Zap },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

type SubscriptionInfo = {
  plan: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
} | null;

function PlanBadge({
  subscription,
  restaurantId,
}: {
  subscription: SubscriptionInfo;
  restaurantId: string;
}) {
  if (!subscription) {
    return (
      <div className="rounded-xl bg-muted p-3 text-xs">
        <p className="font-medium text-foreground">No plan</p>
        <Link
          to="/dashboard/billing"
          search={{ r: restaurantId }}
          className="mt-0.5 text-primary hover:underline block"
        >
          Set up billing →
        </Link>
      </div>
    );
  }

  const { plan, status, trial_ends_at } = subscription;

  // Pilot plan
  if (plan === "pilot") {
    return (
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs">
        <p className="font-semibold text-primary">Pilot plan</p>
        <p className="mt-0.5 text-muted-foreground">Full access · internal</p>
      </div>
    );
  }

  // Active trial
  if (status === "trialing" && trial_ends_at) {
    const days = getRemainingTrialDays(trial_ends_at);
    if (days > 0) {
      return (
        <Link to="/dashboard/billing" search={{ r: restaurantId }}>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs cursor-pointer hover:bg-amber-500/15 transition-colors">
            <p className="font-semibold text-amber-600 dark:text-amber-400">
              Free trial
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {days} day{days !== 1 ? "s" : ""} remaining
            </p>
          </div>
        </Link>
      );
    }
    // Trial expired
    return (
      <Link to="/dashboard/billing" search={{ r: restaurantId }}>
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs cursor-pointer hover:bg-destructive/15 transition-colors">
          <p className="font-semibold text-destructive">Trial expired</p>
          <p className="mt-0.5 text-muted-foreground">Upgrade to continue</p>
        </div>
      </Link>
    );
  }

  // Active paid plan
  if (status === "active") {
    const planLabel =
      plan === "growth" ? "Growth" : plan === "pro" ? "Pro" : "Starter";
    return (
      <Link to="/dashboard/billing" search={{ r: restaurantId }}>
        <div className="rounded-xl bg-muted p-3 text-xs cursor-pointer hover:bg-muted/80 transition-colors">
          <p className="font-semibold text-foreground">{planLabel} plan</p>
          <p className="mt-0.5 text-muted-foreground">Active</p>
        </div>
      </Link>
    );
  }

  // Past due / paused / cancelled
  if (status === "past_due" || status === "paused" || status === "canceled") {
    return (
      <Link to="/dashboard/billing" search={{ r: restaurantId }}>
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs cursor-pointer hover:bg-destructive/15 transition-colors">
          <p className="font-semibold text-destructive capitalize">
            {status === "past_due" ? "Payment due" : status}
          </p>
          <p className="mt-0.5 text-muted-foreground">Action required</p>
        </div>
      </Link>
    );
  }

  // Fallback
  return (
    <div className="rounded-xl bg-muted p-3 text-xs">
      <p className="font-medium text-foreground capitalize">{plan}</p>
      <p className="mt-0.5 text-muted-foreground capitalize">{status}</p>
    </div>
  );
}

export function DashboardSidebar({
  restaurantName,
  restaurantId,
  subscription,
}: {
  restaurantName: string;
  restaurantId: string;
  subscription: SubscriptionInfo;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="px-5 py-5 flex items-center gap-3">
        <Logo size="sm" showWordmark={false} />
        <div>
          <p className="text-sm font-bold leading-tight">FlipNosh</p>
          <p className="text-xs text-muted-foreground leading-tight truncate">
            {restaurantName}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {nav.map((n) => {
          const active = n.exact
            ? pathname === n.to
            : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to as "/dashboard"}
              search={{ r: restaurantId }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <PlanBadge subscription={subscription} restaurantId={restaurantId} />
      </div>
    </aside>
  );
}
