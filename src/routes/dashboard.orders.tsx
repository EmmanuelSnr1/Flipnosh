import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  getDashboardOrders,
  updateOrderStatus,
  sendRestaurantMessage,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_BACK,
  ORDER_STATUS_LABEL,
  dashboardSearch,
  type DashboardOrder,
  type OrderMessage,
} from "@/api/dashboard";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { gbp } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { MessageCircle, Send, ChevronLeft, RefreshCw } from "lucide-react";
// Sounds are played globally by DashboardSidebar — no import needed here

export const Route = createFileRoute("/dashboard/orders")({
  validateSearch: dashboardSearch,
  loaderDeps: ({ search }) => ({ r: (search as { r?: string }).r }),
  loader: async ({ deps: { r } }) => getDashboardOrders({ data: r! }),
  component: OrdersPage,
});

type Filter = "active" | "completed" | "rejected" | "all";
const ACTIVE = ["pending", "accepted", "preparing", "ready"];

// ── Page component ────────────────────────────────────────────────────────────

function OrdersPage() {
  const loaded = (Route.useLoaderData() ?? []) as DashboardOrder[];
  const router = useRouter();
  const { r: restaurantId } = Route.useSearch();
  const [orders, setOrders]   = useState<DashboardOrder[]>(loaded);
  const [filter, setFilter]   = useState<Filter>("active");
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  // Keep local state in sync when loader refreshes (e.g. after router.invalidate)
  useEffect(() => { setOrders(loaded); }, [loaded]);

  // ── Supabase Realtime: orders + messages ─────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;

    // Orders channel: new orders + payment status changes
    const ordersChannel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload: { new: Record<string, unknown> }) => {
          const num  = payload.new.order_number as string | undefined;
          const name = payload.new.order_name   as string | undefined;
          toast.success("New order!", {
            description: name ?? (num ? `Order ${num} just came in` : "A new order just came in"),
            duration: 8000,
          });
          void router.invalidate();
        },
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const newPay = payload.new.payment_status as string | undefined;
          const oldPay = payload.old.payment_status as string | undefined;
          const num    = payload.new.order_number   as string | undefined;
          if (newPay === "paid" && oldPay !== "paid") {
            toast.success("Payment received!", {
              description: num ? `Order ${num} has been paid` : "An order has been paid",
              duration: 6000,
            });
          } else if (newPay === "failed" && oldPay !== "failed") {
            toast.error("Payment failed", {
              description: num ? `Order ${num} — payment could not be processed` : "A payment failed",
              duration: 8000,
            });
          }
          void router.invalidate();
        },
      )
      .subscribe();

    // Messages channel: customer sends a note — append in-place without full reload
    const msgsChannel = supabase
      .channel(`order-msgs:${restaurantId}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "order_messages", filter: `restaurant_id=eq.${restaurantId}` },
        (payload: { new: { id: string; order_id: string; sender_type: string; message: string; created_at: string } }) => {
          const m = payload.new;
          if (m.sender_type === "customer") {
            toast.info("Customer message", {
              description: `"${m.message.slice(0, 60)}${m.message.length > 60 ? "…" : ""}"`,
              duration: 6000,
            });
          }
          // Append message to the matching order in local state
          setOrders((prev) =>
            prev.map((o) =>
              o.id === m.order_id
                ? {
                    ...o,
                    messages: [
                      ...o.messages,
                      {
                        id:          m.id,
                        sender_type: m.sender_type as "customer" | "restaurant",
                        message:     m.message,
                        created_at:  m.created_at,
                      },
                    ],
                  }
                : o,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ordersChannel);
      void supabase.removeChannel(msgsChannel);
    };
  }, [restaurantId, router]);

  // ── Filtering & counts ────────────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    if (filter === "all")       return true;
    if (filter === "active")    return ACTIVE.includes(o.status);
    if (filter === "completed") return o.status === "completed";
    return o.status === "rejected";
  });

  const counts: Record<Filter, number> = {
    active:    orders.filter((o) => ACTIVE.includes(o.status)).length,
    completed: orders.filter((o) => o.status === "completed").length,
    rejected:  orders.filter((o) => o.status === "rejected").length,
    all:       orders.length,
  };

  // ── Status update ─────────────────────────────────────────────────────────
  const update = async (order: DashboardOrder, status: string) => {
    setUpdating((prev) => new Set(prev).add(order.id));
    try {
      await updateOrderStatus({
        data: {
          orderId: order.id,
          status: status as
            | "pending" | "accepted" | "preparing"
            | "ready" | "completed" | "rejected",
        },
      });
      if (status === "rejected") {
        toast.error(`${order.order_number} rejected`);
      } else {
        toast.success(`${order.order_number} → ${ORDER_STATUS_LABEL[status]}`);
      }
      await router.invalidate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order status",
      );
    } finally {
      setUpdating((prev) => {
        const s = new Set(prev);
        s.delete(order.id);
        return s;
      });
    }
  };

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Real-time order management — new orders arrive automatically."
      />
      <div className="p-6 space-y-4">
        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          {(["active", "completed", "rejected", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm capitalize transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
              <span className={`text-xs ${filter === f ? "opacity-80" : "opacity-60"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Order list ── */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {filter === "active" ? (
              <>
                <p className="font-medium">No active orders right now.</p>
                <p className="mt-1 text-xs">New orders will appear here automatically.</p>
              </>
            ) : (
              <p>No {filter} orders to show.</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                restaurantId={restaurantId!}
                onUpdate={update}
                onMessageSent={(orderId, msg) =>
                  setOrders((prev) =>
                    prev.map((x) =>
                      x.id === orderId
                        ? { ...x, messages: [...x.messages, msg] }
                        : x,
                    ),
                  )
                }
                isUpdating={updating.has(o.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── "NEW" badge — shown for 60 seconds after the order arrives ────────────────

function useIsNew(createdAt: string): boolean {
  const [isNew, setIsNew] = useState(() => {
    return Date.now() - new Date(createdAt).getTime() < 60_000;
  });

  useEffect(() => {
    if (!isNew) return;
    const remaining = 60_000 - (Date.now() - new Date(createdAt).getTime());
    if (remaining <= 0) { setIsNew(false); return; }
    const t = setTimeout(() => setIsNew(false), remaining);
    return () => clearTimeout(t);
  }, [createdAt, isNew]);

  return isNew;
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order,
  restaurantId,
  onUpdate,
  onMessageSent,
  isUpdating,
}: {
  order:         DashboardOrder;
  restaurantId:  string;
  onUpdate:      (o: DashboardOrder, s: string) => void;
  onMessageSent: (orderId: string, msg: OrderMessage) => void;
  isUpdating:    boolean;
}) {
  const nextStatuses  = ORDER_STATUS_FLOW[order.status] ?? [];
  const backStatus    = ORDER_STATUS_BACK[order.status] ?? null;
  const isNew         = useIsNew(order.created_at);
  const [showMsgs, setShowMsgs] = useState(order.messages.length > 0);

  // Show messages panel automatically when a new message arrives
  useEffect(() => {
    if (order.messages.length > 0) setShowMsgs(true);
  }, [order.messages.length]);

  return (
    <div className={`rounded-2xl border bg-card p-4 sm:p-5 transition-colors ${
      isNew ? "border-primary/40 shadow-sm shadow-primary/10" : "border-border"
    }`}>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{order.order_number}</h3>
            {isNew && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase tracking-wide animate-pulse">
                New
              </span>
            )}
            <OrderStatusBadge status={order.status as never} />
            <PaymentStatusBadge status={order.payment_status} refundAmountPence={order.refund_amount_pence} />
            <span className="text-xs text-muted-foreground capitalize">· {order.fulfilment_type}</span>
            {order.source && (
              <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                via {order.source}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {order.customer_name}
            {order.customer_phone && ` · ${order.customer_phone}`}
            {" · "}
            {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Message thread toggle */}
          <button
            onClick={() => setShowMsgs((v) => !v)}
            className={`relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
              showMsgs
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Customer messages"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {order.messages.length > 0 && (
              <span className={`font-medium ${
                order.messages.some((m) => m.sender_type === "customer")
                  ? "text-primary"
                  : ""
              }`}>{order.messages.length}</span>
            )}
          </button>
          <span className="text-lg font-bold">{gbp(order.total_pence / 100)}</span>
        </div>
      </div>

      {/* ── Items ── */}
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((it) => {
          const mods = it.selected_modifiers ?? [];
          return (
            <li key={it.id} className="text-muted-foreground">
              <span className="font-medium text-foreground">{it.quantity}×</span>{" "}
              {it.name}
              {mods.length > 0 && (
                <span className="ml-1 text-xs">
                  ({mods.map((m) => m.optionName).join(", ")})
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* ── Notes ── */}
      {order.notes && (
        <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs italic text-muted-foreground">
          Note: {order.notes}
        </p>
      )}

      {/* ── Message thread ── */}
      {showMsgs && (
        <OrderMessageThread
          order={order}
          restaurantId={restaurantId}
          onMessageSent={onMessageSent}
        />
      )}

      {/* ── Status actions ── */}
      {(nextStatuses.length > 0 || backStatus) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Back step */}
          {backStatus && (
            <button
              disabled={isUpdating}
              onClick={() => onUpdate(order, backStatus)}
              title={`Revert to ${ORDER_STATUS_LABEL[backStatus]}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-muted-foreground border border-border hover:bg-muted transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {ORDER_STATUS_LABEL[backStatus]}
            </button>
          )}

          {/* Divider if both back and forward exist */}
          {backStatus && nextStatuses.length > 0 && (
            <span className="text-muted-foreground/30 text-xs">|</span>
          )}

          {/* Forward / reject steps */}
          {nextStatuses.map((s) => {
            const isReject = s === "rejected";
            return (
              <button
                key={s}
                disabled={isUpdating}
                onClick={() => onUpdate(order, s)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                  isReject
                    ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isUpdating ? "Updating…" : isReject ? "Reject" : `Mark ${ORDER_STATUS_LABEL[s]}`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Message thread (dashboard side) ──────────────────────────────────────────

function OrderMessageThread({
  order,
  restaurantId,
  onMessageSent,
}: {
  order:         DashboardOrder;
  restaurantId:  string;
  onMessageSent: (orderId: string, msg: OrderMessage) => void;
}) {
  const [text, setText]     = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [order.messages.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendRestaurantMessage({
        data: { orderId: order.id, restaurantId, message: trimmed },
      });
      onMessageSent(order.id, {
        id:          `temp-${Date.now()}`,
        sender_type: "restaurant",
        message:     trimmed,
        created_at:  new Date().toISOString(),
      });
      setText("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border overflow-hidden">
      {/* Thread */}
      <div className="px-3 py-2.5 space-y-2 max-h-48 overflow-y-auto bg-muted/20">
        {order.messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No messages yet.</p>
        ) : (
          order.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender_type === "restaurant" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs ${
                  msg.sender_type === "restaurant"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-background border border-border text-foreground rounded-bl-sm"
                }`}
              >
                {msg.message}
              </div>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {msg.sender_type === "restaurant" ? "You" : "Customer"}
                {" · "}
                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="flex gap-2 px-2 py-2 bg-background border-t border-border">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
          placeholder="Reply to customer…"
          maxLength={500}
          disabled={sending}
          className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          onClick={() => void send()}
          disabled={!text.trim() || sending}
          className="rounded-lg bg-primary px-2.5 py-1.5 text-primary-foreground disabled:opacity-50"
          aria-label="Send"
        >
          {sending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── Payment status badge ──────────────────────────────────────────────────────

function PaymentStatusBadge({
  status,
  refundAmountPence,
}: {
  status:            string;
  refundAmountPence: number | null;
}) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          ✓ Paid
        </span>
      );
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
          ↩ Refunded{refundAmountPence ? ` ${gbp(refundAmountPence / 100)}` : ""}
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
          Awaiting payment
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
          Payment failed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          Cancelled
        </span>
      );
    case "unpaid":
    default:
      return null;
  }
}
