import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, ShoppingBag, CreditCard, AlertTriangle, CheckCheck, Volume2 } from "lucide-react";
import { toast } from "sonner";
import {
  dashboardSearch,
  getDashboardNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type DashboardNotification,
} from "@/api/dashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { supabase } from "@/lib/supabase/client";
import { testNotificationSound } from "@/lib/notifications/sound";

export const Route = createFileRoute("/dashboard/notifications")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) =>
    getDashboardNotifications({ data: r! }),
  component: NotificationsPage,
});

// ── Icon by type ──────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: string }) {
  const cls = "h-4 w-4 shrink-0 mt-0.5";
  switch (type) {
    case "new_order":
      return <ShoppingBag className={`${cls} text-primary`} />;
    case "order_paid":
      return <CreditCard className={`${cls} text-emerald-500`} />;
    case "payment_failed":
      return <AlertTriangle className={`${cls} text-red-500`} />;
    default:
      return <Bell className={`${cls} text-muted-foreground`} />;
  }
}

// ── Notification row ──────────────────────────────────────────────────────────

function NotifRow({
  notif,
  restaurantId,
  onRead,
}: {
  notif:        DashboardNotification;
  restaurantId: string;
  onRead:       (id: string) => void;
}) {
  const markRead = async () => {
    if (notif.is_read) return;
    try {
      await markNotificationRead({ data: { id: notif.id } });
      onRead(notif.id);
    } catch {
      // Non-critical
    }
  };

  const inner = (
    <div
      onClick={markRead}
      className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-colors ${
        notif.is_read
          ? "border-border bg-card"
          : "border-primary/20 bg-primary/5 hover:bg-primary/8"
      }`}
    >
      <NotifIcon type={notif.type} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${notif.is_read ? "font-normal" : "font-semibold"}`}>
            {notif.title}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {notif.body}
        </p>
      </div>
      {!notif.is_read && (
        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </div>
  );

  if (notif.order_id) {
    return (
      <Link to="/dashboard/orders" search={{ r: restaurantId }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

// ── Page ──────────────────────────────────────────────────────────────────────

function NotificationsPage() {
  const loaded      = (Route.useLoaderData() ?? []) as DashboardNotification[];
  const { r: restaurantId } = Route.useSearch();
  const router      = useRouter();

  const [notifs, setNotifs] = useState<DashboardNotification[]>(loaded);
  const [marking, setMarking] = useState(false);

  // Keep local state in sync when loader data refreshes
  useEffect(() => {
    setNotifs(loaded);
  }, [loaded]);

  // ── Realtime: prepend new notifications as they arrive ────────────────────
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`notifs-page:${restaurantId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event:  "INSERT",
          schema: "public",
          table:  "restaurant_notifications",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload: { new: DashboardNotification }) => {
          setNotifs((prev) => [payload.new, ...prev]);
          // Sound is played globally by DashboardSidebar
        },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [restaurantId]);

  const unread = notifs.filter((n) => !n.is_read).length;

  const handleMarkOne = (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAll = async () => {
    if (!restaurantId || unread === 0) return;
    setMarking(true);
    try {
      await markAllNotificationsRead({ data: restaurantId });
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
      void router.invalidate();
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarking(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Order alerts and payment updates for your restaurant."
      />

      <div className="p-6 space-y-4 max-w-2xl">
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {unread} unread
              </span>
            )}
            {unread === 0 && notifs.length > 0 && (
              <span className="text-xs text-muted-foreground">All caught up ✓</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sound test */}
            <button
              onClick={() => testNotificationSound()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl px-3 py-1.5 border border-border hover:bg-muted transition-colors"
            >
              <Volume2 className="h-3.5 w-3.5" />
              Test sound
            </button>

            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={marking}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl px-3 py-1.5 border border-border hover:bg-muted transition-colors disabled:opacity-60"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* ── List ── */}
        {notifs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No notifications yet</p>
            <p className="mt-1 text-xs">Order alerts and payment updates will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => (
              <NotifRow
                key={n.id}
                notif={n}
                restaurantId={restaurantId!}
                onRead={handleMarkOne}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
