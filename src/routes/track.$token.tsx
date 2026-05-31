/**
 * /track/$token — Public order tracking page.
 *
 * No login required. Accessible to customers via the link on their receipt.
 *
 * - Loads initial data server-side via loader
 * - Polls every 12 s for status updates
 * - Shows restaurant branding + contact info
 * - Live message thread: customers can send notes, restaurant can reply
 * - Handles: not-found, rejected, payment-failed, active/completed states
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ChefHat,
  Package,
  Truck,
  ShoppingBag,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  RefreshCw,
} from "lucide-react";
import {
  getOrderTrackingByToken,
  addOrderMessage,
  type OrderTrackingResult,
  type TrackingMessage,
} from "@/api/order-tracking";
import { gbp } from "@/lib/utils/format";
import { formatDistanceToNow } from "date-fns";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/track/$token")({
  loader: async ({ params: { token } }) =>
    getOrderTrackingByToken({ data: token }),
  component: TrackingPage,
});

// ─── Status helpers ───────────────────────────────────────────────────────────

type StatusStep = {
  key: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PICKUP_STEPS: StatusStep[] = [
  { key: "pending",   label: "Order received",       sublabel: "Waiting for restaurant",  icon: ShoppingBag  },
  { key: "accepted",  label: "Order accepted",        sublabel: "Restaurant confirmed it", icon: CheckCircle2 },
  { key: "preparing", label: "Being prepared",        sublabel: "Kitchen is on it",        icon: ChefHat      },
  { key: "ready",     label: "Ready for collection",  sublabel: "Come pick it up!",        icon: Package      },
  { key: "completed", label: "Order complete",        sublabel: "Enjoy!",                  icon: CheckCircle2 },
];

const DELIVERY_STEPS: StatusStep[] = [
  { key: "pending",   label: "Order received",        sublabel: "Waiting for restaurant",  icon: ShoppingBag  },
  { key: "accepted",  label: "Order accepted",        sublabel: "Restaurant confirmed it", icon: CheckCircle2 },
  { key: "preparing", label: "Being prepared",        sublabel: "Kitchen is on it",        icon: ChefHat      },
  { key: "ready",     label: "Out for delivery",      sublabel: "On its way to you!",      icon: Truck        },
  { key: "completed", label: "Order delivered",       sublabel: "Enjoy!",                  icon: CheckCircle2 },
];

const STATUS_ORDER = ["pending", "accepted", "preparing", "ready", "completed"];

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ─── Poll interval ────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 12_000;
const TERMINAL_STATUSES = new Set(["completed", "rejected"]);
const TERMINAL_PAYMENT  = new Set(["paid", "refunded", "failed", "cancelled"]);

// ─── Page component ───────────────────────────────────────────────────────────

function TrackingPage() {
  const token   = Route.useParams().token;
  const initial = Route.useLoaderData() as OrderTrackingResult;
  const [data, setData] = useState<OrderTrackingResult>(initial);

  // ── Polling for live updates ─────────────────────────────────────────────
  useEffect(() => {
    if (!data.found) return;
    const order = data as Extract<OrderTrackingResult, { found: true }>;
    if (TERMINAL_STATUSES.has(order.status) && TERMINAL_PAYMENT.has(order.paymentStatus)) {
      return; // Both terminal — stop polling
    }

    const id = setInterval(async () => {
      try {
        const fresh = await getOrderTrackingByToken({ data: token });
        setData(fresh);
      } catch { /* keep last known state */ }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [token, data]);

  // ── Not found ────────────────────────────────────────────────────────────
  if (!data.found) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-6">
          <XCircle className="h-14 w-14 text-muted-foreground" />
          <h1 className="text-xl font-bold">Order not found</h1>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            This tracking link is invalid or has expired. Check your receipt for the correct link.
          </p>
        </div>
      </Shell>
    );
  }

  const order = data;

  return (
    <Shell
      restaurantName={order.restaurantName}
      restaurantLogoUrl={order.restaurantLogoUrl}
      restaurantPhone={order.restaurantPhone}
      restaurantAddress={order.restaurantAddress}
    >
      {/* ── Order header ── */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Order</p>
        <h2 className="text-lg font-bold mt-0.5">{order.orderNumber}</h2>
        {order.orderName && order.orderName !== order.orderNumber && (
          <p className="text-sm text-muted-foreground">{order.orderName}</p>
        )}
      </div>

      {/* ── Rejected state ── */}
      {order.status === "rejected" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <XCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="font-semibold text-destructive">Order cancelled</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Unfortunately the restaurant could not fulfil this order.
          </p>
          {order.paymentStatus === "refunded" && (
            <p className="mt-2 text-xs text-emerald-600 font-medium">
              ✓ Your payment has been refunded.
            </p>
          )}
          <Link
            to="/r/$slug"
            params={{ slug: order.restaurantSlug }}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Return to menu →
          </Link>
        </div>
      )}

      {/* ── Payment failed state ── */}
      {order.status !== "rejected" && order.paymentStatus === "failed" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <XCircle className="mx-auto h-8 w-8 text-destructive mb-2" />
          <p className="font-semibold text-destructive">Payment failed</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your payment could not be processed. You have not been charged.
          </p>
          <Link
            to="/r/$slug"
            params={{ slug: order.restaurantSlug }}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Return to menu →
          </Link>
        </div>
      )}

      {/* ── Timeline ── */}
      {order.status !== "rejected" && order.paymentStatus !== "failed" && (
        <StatusTimeline status={order.status} fulfilmentType={order.fulfilmentType} />
      )}

      {/* ── Estimated time ── */}
      {!TERMINAL_STATUSES.has(order.status) && order.paymentStatus !== "failed" && (
        <div className="rounded-2xl bg-muted p-4 text-center">
          <Clock className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
          <p className="text-sm font-medium">
            Estimated {order.fulfilmentType === "delivery" ? "delivery" : "ready"} time
          </p>
          <p className="text-lg font-bold mt-0.5">~{order.estimatedMinutes} minutes</p>
        </div>
      )}

      {/* ── Payment badge ── */}
      <PaymentBadge status={order.paymentStatus} />

      {/* ── Order items ── */}
      <div className="rounded-2xl border border-border p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
          Your order
        </p>
        <ul className="space-y-2">
          {order.items.map((item) => {
            const mods = item.selected_modifiers ?? [];
            return (
              <li key={item.id} className="flex justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium">{item.quantity}×</span>{" "}
                  {item.name}
                  {mods.length > 0 && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({mods.map((m) => m.optionName).join(", ")})
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{gbp(order.totalPence / 100)}</span>
        </div>
      </div>

      {/* ── Message thread ── */}
      <MessageThread
        token={token}
        orderId={order.orderId}
        messages={order.messages}
        closed={
          TERMINAL_STATUSES.has(order.status) ||
          order.paymentStatus === "failed" ||
          order.paymentStatus === "cancelled"
        }
        onMessageSent={(newMsg) =>
          setData((prev) =>
            prev.found
              ? { ...prev, messages: [...prev.messages, newMsg] }
              : prev,
          )
        }
      />

      {/* ── Footer ── */}
      <div className="text-center text-xs text-muted-foreground">
        <span className="capitalize font-medium">{order.fulfilmentType}</span>
        {" · "}
        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        {!TERMINAL_STATUSES.has(order.status) && (
          <>
            {" · "}
            <span className="text-muted-foreground/70">Updates every 12 s</span>
          </>
        )}
      </div>
    </Shell>
  );
}

// ─── Message thread ───────────────────────────────────────────────────────────

function MessageThread({
  token,
  orderId,
  messages,
  closed,
  onMessageSent,
}: {
  token:         string;
  orderId:       string;
  messages:      TrackingMessage[];
  closed:        boolean;
  onMessageSent: (msg: TrackingMessage) => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      await addOrderMessage({ data: { token, message: trimmed } });
      onMessageSent({
        id:          `temp-${Date.now()}`,
        sender_type: "customer",
        message:     trimmed,
        created_at:  new Date().toISOString(),
      });
      setText("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      setError("Couldn't send — please try again.");
    } finally {
      setSending(false);
    }
  };

  void orderId; // orderId available for future features

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">
          {closed ? "Order messages" : "Message the restaurant"}
        </p>
      </div>

      {/* Thread */}
      <div className="px-4 py-3 space-y-3 max-h-60 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            {closed
              ? "No messages were sent for this order."
              : "Send a note — e.g. \"no onions please\" or \"extra sauce on the side\"."}
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — hidden when order is closed */}
      {closed ? (
        <div className="px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            This order is closed — no new messages can be sent.
          </p>
        </div>
      ) : (
        <div className="px-3 pb-3 pt-1 border-t border-border bg-background">
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
              placeholder="Type a message…"
              rows={2}
              maxLength={500}
              disabled={sending}
              className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
            />
            <button
              onClick={() => void send()}
              disabled={!text.trim() || sending}
              className="self-end rounded-xl bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50 transition-opacity"
              aria-label="Send message"
            >
              {sending
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </button>
          </div>
          {sent  && <p className="mt-1 text-xs text-emerald-600">Message sent ✓</p>}
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          <p className="mt-1 text-[10px] text-muted-foreground/60 text-right">
            {text.length}/500
          </p>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: TrackingMessage }) {
  const isCustomer = msg.sender_type === "customer";
  return (
    <div className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
          isCustomer
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {msg.message}
      </div>
      <span className="mt-0.5 text-[10px] text-muted-foreground">
        {isCustomer ? "You" : "Restaurant"}{" · "}
        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
      </span>
    </div>
  );
}

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status, fulfilmentType }: { status: string; fulfilmentType: string }) {
  const steps = fulfilmentType === "delivery" ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIdx = getStepIndex(status);

  return (
    <ol className="relative">
      {steps.map((step, idx) => {
        const isDone    = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;

        return (
          <li key={step.key} className="flex gap-4 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/20 bg-transparent text-muted-foreground/30"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
              </div>
              {idx < steps.length - 1 && (
                <div className={`mt-1 w-0.5 flex-1 transition-colors ${isDone ? "bg-primary" : "bg-muted-foreground/20"}`} />
              )}
            </div>
            <div className="pt-1 pb-2">
              <p className={`text-sm font-medium leading-tight ${isPending ? "text-muted-foreground/40" : "text-foreground"}`}>
                {step.label}
                {isCurrent && (
                  <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-primary align-middle animate-pulse" />
                )}
              </p>
              {(isDone || isCurrent) && step.sublabel && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Payment badge ────────────────────────────────────────────────────────────

function PaymentBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" /> Paid
      </div>
    );
  }
  if (status === "refunded") {
    return (
      <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
        <RefreshCw className="h-4 w-4" /> Refunded
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
        <Clock className="h-4 w-4" /> Payment pending
      </div>
    );
  }
  return null;
}

// ─── Shell layout ─────────────────────────────────────────────────────────────

function Shell({
  children,
  restaurantName,
  restaurantLogoUrl,
  restaurantPhone,
  restaurantAddress,
}: {
  children:           React.ReactNode;
  restaurantName?:    string;
  restaurantLogoUrl?: string | null;
  restaurantPhone?:   string | null;
  restaurantAddress?: string | null;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-sm space-y-5">

        {/* Restaurant branding + contact */}
        {restaurantName && (
          <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center gap-3 text-center">
            {restaurantLogoUrl && (
              <img
                src={restaurantLogoUrl}
                alt={restaurantName}
                className="h-14 w-14 rounded-xl object-cover"
              />
            )}
            <p className="font-bold text-lg leading-tight">{restaurantName}</p>

            {/* Contact links */}
            {(restaurantPhone || restaurantAddress) && (
              <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                {restaurantPhone && (
                  <a
                    href={`tel:${restaurantPhone}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {restaurantPhone}
                  </a>
                )}
                {restaurantAddress && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {restaurantAddress}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {children}

        <p className="text-center text-xs text-muted-foreground/50">Powered by FlipNosh</p>
      </div>
    </div>
  );
}
