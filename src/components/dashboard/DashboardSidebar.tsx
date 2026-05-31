import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Bell,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { getRemainingTrialDays } from "@/lib/billing/plans";
import { supabase } from "@/lib/supabase/client";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/orders", label: "Orders", icon: Receipt },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
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

  if (plan === "pilot") {
    return (
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs">
        <p className="font-semibold text-primary">Pilot plan</p>
        <p className="mt-0.5 text-muted-foreground">Full access · internal</p>
      </div>
    );
  }

  if (status === "trialing" && trial_ends_at) {
    const days = getRemainingTrialDays(trial_ends_at);
    if (days > 0) {
      return (
        <Link to="/dashboard/billing" search={{ r: restaurantId }}>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs cursor-pointer hover:bg-amber-500/15 transition-colors">
            <p className="font-semibold text-amber-600 dark:text-amber-400">Free trial</p>
            <p className="mt-0.5 text-muted-foreground">
              {days} day{days !== 1 ? "s" : ""} remaining
            </p>
          </div>
        </Link>
      );
    }
    return (
      <Link to="/dashboard/billing" search={{ r: restaurantId }}>
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs cursor-pointer hover:bg-destructive/15 transition-colors">
          <p className="font-semibold text-destructive">Trial expired</p>
          <p className="mt-0.5 text-muted-foreground">Upgrade to continue</p>
        </div>
      </Link>
    );
  }

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

  return (
    <div className="rounded-xl bg-muted p-3 text-xs">
      <p className="font-medium text-foreground capitalize">{plan}</p>
      <p className="mt-0.5 text-muted-foreground capitalize">{status}</p>
    </div>
  );
}

// ─── Shared nav list (used in both desktop sidebar and mobile drawer) ─────────

function NavList({
  pathname,
  restaurantId,
  unreadCount,
  onNavigate,
}: {
  pathname:     string;
  restaurantId: string;
  unreadCount:  number;
  onNavigate?:  () => void;
}) {
  return (
    <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
      {nav.map((n) => {
        const active = n.exact
          ? pathname === n.to
          : pathname.startsWith(n.to);
        const isNotifications = n.to === "/dashboard/notifications";
        return (
          <Link
            key={n.to}
            to={n.to as "/dashboard"}
            search={{ r: restaurantId }}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <n.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{n.label}</span>
            {isNotifications && unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Sidebar header (logo + restaurant name) ──────────────────────────────────

function SidebarHeader({
  restaurantName,
  onClose,
}: {
  restaurantName: string;
  onClose?: () => void;
}) {
  return (
    <div className="px-5 py-5 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Logo size="sm" showWordmark={false} />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">FlipNosh</p>
          <p className="text-xs text-muted-foreground leading-tight truncate">
            {restaurantName}
          </p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="md:hidden rounded-full p-1.5 hover:bg-muted text-muted-foreground shrink-0"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DashboardSidebar({
  restaurantName,
  restaurantId,
  subscription,
}: {
  restaurantName: string;
  restaurantId: string;
  subscription: SubscriptionInfo;
}) {
  const pathname    = useRouterState({ select: (s) => s.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Live unread notification count ───────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;

    // Initial count query
    supabase
      .from("restaurant_notifications")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));

    // Realtime: increment on INSERT, decrement on UPDATE (mark read)
    const channel = supabase
      .channel(`notif-badge:${restaurantId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event:  "INSERT",
          schema: "public",
          table:  "restaurant_notifications",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => setUnreadCount((c) => c + 1),
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event:  "UPDATE",
          schema: "public",
          table:  "restaurant_notifications",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload: { new: { is_read: boolean }; old: { is_read: boolean } }) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [restaurantId]);

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ── Desktop sidebar (md+) ────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar sticky top-0 h-screen overflow-y-auto">
        <SidebarHeader restaurantName={restaurantName} />
        <NavList pathname={pathname} restaurantId={restaurantId} unreadCount={unreadCount} />
        <div className="p-3 border-t border-border shrink-0">
          <PlanBadge subscription={subscription} restaurantId={restaurantId} />
        </div>
      </aside>

      {/* ── Mobile top bar (< md) ────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-background/95 backdrop-blur border-b border-border">
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-xl p-2 hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Logo size="sm" showWordmark={false} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {restaurantName}
            </p>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer backdrop ───────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── Mobile drawer panel ──────────────────────────────────────────── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-sidebar border-r border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarHeader
          restaurantName={restaurantName}
          onClose={() => setDrawerOpen(false)}
        />
        <NavList
          pathname={pathname}
          restaurantId={restaurantId}
          unreadCount={unreadCount}
          onNavigate={() => setDrawerOpen(false)}
        />
        <div className="p-3 border-t border-border shrink-0">
          <PlanBadge subscription={subscription} restaurantId={restaurantId} />
        </div>
      </aside>
    </>
  );
}
