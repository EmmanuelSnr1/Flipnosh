/**
 * /order-success?session_id=cs_...
 *
 * Landing page after a successful Stripe Checkout redirect.
 * - Reads ?session_id from the URL
 * - Calls getPaymentStatusForOrder (which cross-checks Stripe if DB is still pending)
 * - Shows success / polling / failure UI
 * - Clears the cart only once payment is confirmed paid
 * - Links back to the restaurant menu
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { cart } from "@/stores/cart-store";
import { getPaymentStatusForOrder, type PaymentStatusResult } from "@/api/payments";
import { gbp } from "@/lib/utils/format";

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/order-success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : "",
  }),
  // We deliberately do NOT load in the loader so that we can poll client-side
  // and clear the cart on success without it affecting SSR.
  loader: () => ({}),
  component: OrderSuccessPage,
});

// ─── Polling config ───────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;   // poll every 3 s
const MAX_POLL_ATTEMPTS = 20;     // give up after ~60 s

// ─── Page component ───────────────────────────────────────────────────────────

function OrderSuccessPage() {
  const { session_id } = Route.useSearch();

  const [result, setResult]   = useState<PaymentStatusResult | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const cartClearedRef        = useRef(false);
  const pollCountRef          = useRef(0);

  useEffect(() => {
    if (!session_id) {
      setError("Missing payment session — please contact the restaurant if you were charged.");
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const data = await getPaymentStatusForOrder({ data: { sessionId: session_id } });
        if (cancelled) return;

        setResult(data);

        if (data.paymentStatus === "paid") {
          // Success — clear the cart exactly once
          if (!cartClearedRef.current) {
            cartClearedRef.current = true;
            cart.clear();
          }
          return; // Stop polling
        }

        if (data.paymentStatus === "failed" || data.paymentStatus === "cancelled") {
          return; // Stop polling — terminal failure state
        }

        // Still pending — poll again if we haven't hit the limit
        pollCountRef.current += 1;
        if (pollCountRef.current < MAX_POLL_ATTEMPTS) {
          setTimeout(check, POLL_INTERVAL_MS);
          setPolling(true);
        } else {
          // Timed out — show partial result; webhook may still arrive
          setPolling(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to confirm payment. Please contact the restaurant.",
        );
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [session_id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (!result && !error) {
    return <StatusShell icon={<Loader2 className="h-14 w-14 animate-spin text-primary" />} title="Confirming payment…" subtitle="Please wait a moment." />;
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <StatusShell
        icon={<XCircle className="h-14 w-14 text-red-500" />}
        title="Something went wrong"
        subtitle={error}
      />
    );
  }

  // ── Order not found ──────────────────────────────────────────────────────
  if (!result?.found) {
    return (
      <StatusShell
        icon={<XCircle className="h-14 w-14 text-red-500" />}
        title="Order not found"
        subtitle="We couldn't find your order. If you were charged, please contact the restaurant."
      />
    );
  }

  // ── Paid ─────────────────────────────────────────────────────────────────
  if (result.paymentStatus === "paid") {
    return <PaidView result={result} />;
  }

  // ── Failed / Cancelled ────────────────────────────────────────────────────
  if (result.paymentStatus === "failed" || result.paymentStatus === "cancelled") {
    return (
      <StatusShell
        icon={<XCircle className="h-14 w-14 text-red-500" />}
        title="Payment not completed"
        subtitle={
          result.paymentStatus === "cancelled"
            ? "Your payment was cancelled. You have not been charged."
            : "Your payment could not be processed. You have not been charged."
        }
        footer={
          result.restaurantSlug ? (
            <Link
              to="/r/$slug"
              params={{ slug: result.restaurantSlug }}
              className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Return to menu
            </Link>
          ) : undefined
        }
      />
    );
  }

  // ── Still pending (polling timed out) ────────────────────────────────────
  return (
    <StatusShell
      icon={
        polling
          ? <Loader2 className="h-14 w-14 animate-spin text-primary" />
          : <Clock className="h-14 w-14 text-amber-500" />
      }
      title={polling ? "Confirming payment…" : "Payment is being confirmed"}
      subtitle={
        polling
          ? "This should only take a moment."
          : "Your payment is being processed. You'll receive confirmation shortly."
      }
    />
  );
}

// ─── Paid view ────────────────────────────────────────────────────────────────

function PaidView({ result }: { result: PaymentStatusResult }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center rounded-3xl border border-border bg-card p-8 shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold">Payment confirmed!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.customerName ? `Thanks ${result.customerName} — ` : ""}
          <span className="font-medium text-foreground">{result.restaurantName ?? "The restaurant"}</span>{" "}
          has received your order{" "}
          {result.orderNumber && (
            <span className="font-medium text-foreground">{result.orderNumber}</span>
          )}
          .
        </p>

        <div className="mt-6 rounded-2xl bg-muted p-4 text-left text-sm space-y-3">
          {result.orderNumber && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                Order
              </p>
              <p className="font-medium">{result.orderNumber}</p>
            </div>
          )}

          {result.fulfilmentType && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                Fulfilment
              </p>
              <p className="font-medium capitalize">{result.fulfilmentType}</p>
            </div>
          )}

          {result.estimatedMinutes && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                Estimated{" "}
                {result.fulfilmentType === "pickup" ? "ready time" : "delivery time"}
              </p>
              <p className="font-medium">~{result.estimatedMinutes} minutes</p>
            </div>
          )}

          {result.totalPence !== null && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
                Total paid
              </p>
              <p className="font-medium">{gbp(result.totalPence / 100)}</p>
            </div>
          )}

          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium">
              Payment
            </p>
            <p className="font-medium text-emerald-600 dark:text-emerald-400">
              Paid via Stripe
            </p>
          </div>
        </div>

        {result.restaurantSlug && (
          <Link
            to="/r/$slug"
            params={{ slug: result.restaurantSlug }}
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Back to menu
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Generic status shell ─────────────────────────────────────────────────────

function StatusShell({
  icon,
  title,
  subtitle,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center">{icon}</div>
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}
