import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Route as SlugRoute } from "@/routes/r.$slug";
import { cart, useCart } from "@/stores/cart-store";
import { createStorefrontOrder } from "@/api/orders";
import { createCheckoutSessionForOrder } from "@/api/payments";
import { gbp } from "@/lib/utils/format";
import { ChevronLeft, Lock, Banknote, CreditCard } from "lucide-react";
import { FulfillmentSelector } from "@/components/storefront/FulfillmentSelector";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { toast } from "sonner";

export const Route = createFileRoute("/r/$slug/checkout")({
  loader: () => ({}),
  component: CheckoutPage,
});

type PaymentMethod = "card" | "cash";

function CheckoutPage() {
  const { restaurant } = SlugRoute.useLoaderData();
  const state = useCart();
  const navigate = useNavigate();

  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [notes, setNotes]     = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Payment method — default to card when Stripe is available, cash otherwise
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    restaurant.canAcceptOnlinePayments ? "card" : "cash",
  );

  // Whether this particular submission will go through Stripe
  const useStripe = paymentMethod === "card" && restaurant.canAcceptOnlinePayments;

  // Totals — prices in the cart are in pounds (floats)
  const subtotal = state.items.reduce((sum, i) => {
    const mods = i.modifiers.reduce((s, m) => s + m.price, 0);
    return sum + (i.price + mods) * i.quantity;
  }, 0);

  const deliveryFee =
    state.fulfillment === "delivery"
      ? (restaurant.fulfilment.delivery.fee ?? 2.5)
      : 0;
  const total = subtotal + deliveryFee;

  // ── Pay via Stripe Checkout ───────────────────────────────────────────────
  const submitStripe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const source = cart.getState().source;

      const result = await createCheckoutSessionForOrder({
        data: {
          restaurantId:    restaurant.id,
          customerName:    name.trim(),
          customerPhone:   phone.trim() || undefined,
          customerEmail:   email.trim() || undefined,
          fulfilmentType:  state.fulfillment,
          deliveryAddress: state.fulfillment === "delivery" ? address.trim() : undefined,
          notes:           notes.trim() || undefined,
          source:          source ?? undefined,
          items: state.items.map((i) => ({
            menuItemId:        i.menuItemId,
            quantity:          i.quantity,
            selectedModifiers: i.modifiers.map((m) => ({
              groupName:  m.groupName,
              optionName: m.optionName,
            })),
          })),
        },
      });

      // Cart is cleared only on /order-success, not here
      window.location.href = result.checkoutUrl;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start checkout. Please try again.",
      );
      setSubmitting(false);
    }
  };

  // ── Cash / unpaid order ───────────────────────────────────────────────────
  const submitUnpaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const source = cart.getState().source;

      const subtotalPence    = Math.round(subtotal * 100);
      const deliveryFeePence = Math.round(deliveryFee * 100);
      const totalPence       = Math.round(total * 100);

      const orderNotes = [
        notes,
        state.fulfillment === "delivery" && address ? `Address: ${address}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      const result = await createStorefrontOrder({
        data: {
          restaurantId:    restaurant.id,
          customerName:    name.trim(),
          customerPhone:   phone.trim() || undefined,
          customerEmail:   email.trim() || undefined,
          fulfilmentType:  state.fulfillment,
          subtotalPence,
          deliveryFeePence,
          totalPence,
          notes:           orderNotes || undefined,
          source:          source ?? undefined,
          items: state.items.map((i) => {
            const modsTotalPounds = i.modifiers.reduce((s, m) => s + m.price, 0);
            const unitPricePounds = i.price + modsTotalPounds;
            return {
              menuItemId:        i.menuItemId,
              name:              i.name,
              quantity:          i.quantity,
              unitPricePence:    Math.round(unitPricePounds * 100),
              totalPence:        Math.round(unitPricePounds * i.quantity * 100),
              selectedModifiers: i.modifiers.map((m) => ({
                groupName:  m.groupName,
                optionName: m.optionName,
                pricePence: Math.round(m.price * 100),
              })),
            };
          }),
        },
      });

      cart.clear();
      navigate({
        to: "/r/$slug/success",
        params: { slug: restaurant.slug },
        search: (prev) => ({
          ...prev,
          order: result.order_number,
          name:  name.trim(),
          type:  state.fulfillment,
        }),
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to place order. Please try again.",
      );
      setSubmitting(false);
    }
  };

  const onSubmit = useStripe ? submitStripe : submitUnpaid;

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link
            to="/r/$slug"
            params={{ slug: restaurant.slug }}
            className="mt-3 inline-block text-primary font-medium"
          >
            ← Back to menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {submitting && (
        <LoadingScreen
          label={useStripe ? "Redirecting to secure payment…" : "Placing your order…"}
        />
      )}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-2">
          <Link
            to="/r/$slug"
            params={{ slug: restaurant.slug }}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="ml-2 font-semibold">Checkout · {restaurant.name}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr,360px]">
        <form onSubmit={onSubmit} className="space-y-5">

          {/* ── Fulfilment ── */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Fulfilment</h2>
            <FulfillmentSelector restaurant={restaurant} />
          </section>

          {/* ── Contact ── */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Contact</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={name}  onChange={setName}  required />
              <Field label="Phone"     value={phone} onChange={setPhone} required />
              <div className="sm:col-span-2">
                <Field
                  label={useStripe ? "Email (for receipt)" : "Email (optional)"}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  required={useStripe}
                />
              </div>
            </div>
          </section>

          {/* ── Fulfilment details / notes ── */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3 capitalize">
              {state.fulfillment} details
            </h2>
            {state.fulfillment === "pickup" ? (
              <p className="text-sm text-muted-foreground">
                Pickup at{" "}
                <span className="font-medium text-foreground">
                  {restaurant.address}, {restaurant.postcode}
                </span>
                . Ready in ~{restaurant.fulfilment.pickup.prepTimeMinutes} min.
              </p>
            ) : (
              <div className="grid gap-3">
                <Field
                  label="Delivery address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Street, postcode"
                  required
                />
              </div>
            )}
            <div className="mt-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  Order notes (optional)
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, special instructions…"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </section>

          {/* ── Payment method ── */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Payment</h2>

            {restaurant.canAcceptOnlinePayments ? (
              /* Show choice when Stripe is connected */
              <div className="grid gap-3 sm:grid-cols-2">
                <PaymentOption
                  id="pay-card"
                  selected={paymentMethod === "card"}
                  onSelect={() => setPaymentMethod("card")}
                  icon={<CreditCard className="h-5 w-5" />}
                  title="Pay by card"
                  description="Secure checkout via Stripe"
                  accent
                />
                <PaymentOption
                  id="pay-cash"
                  selected={paymentMethod === "cash"}
                  onSelect={() => setPaymentMethod("cash")}
                  icon={<Banknote className="h-5 w-5" />}
                  title={
                    state.fulfillment === "pickup"
                      ? "Cash on collection"
                      : "Cash on delivery"
                  }
                  description={
                    state.fulfillment === "pickup"
                      ? "Pay when you pick up your order"
                      : "Pay the driver when your order arrives"
                  }
                />
              </div>
            ) : (
              /* No Stripe — cash only, no choice needed */
              <div className="flex items-start gap-3 text-sm">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Pay on{" "}
                  <span className="font-medium text-foreground">
                    {state.fulfillment === "pickup" ? "collection" : "delivery"}
                  </span>
                  . We accept cash and card.
                </p>
              </div>
            )}

            {/* Stripe security note */}
            {useStripe && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground">
                  You'll be redirected to Stripe's secure checkout. We accept Visa,
                  Mastercard, and Amex. Your card details are never stored here.
                </p>
              </div>
            )}
          </section>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting
              ? useStripe ? "Redirecting…" : "Placing order…"
              : useStripe
                ? `Pay securely · ${gbp(total)}`
                : `Place order · ${gbp(total)}`}
          </button>

        </form>

        {/* ── Order summary ── */}
        <aside className="rounded-2xl border border-border bg-card p-5 h-fit lg:sticky lg:top-4">
          <h2 className="font-semibold mb-3">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {state.items.map((i) => {
              const modTotal = i.modifiers.reduce((s, m) => s + m.price, 0);
              return (
                <li key={i.id}>
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground">
                      {i.quantity} × {i.name}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {gbp((i.price + modTotal) * i.quantity)}
                    </span>
                  </div>
                  {i.modifiers.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground pl-4">
                      {i.modifiers.map((m) => m.optionName).join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="my-4 border-t border-border" />
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={gbp(subtotal)} />
            <Row
              label={state.fulfillment === "delivery" ? "Delivery" : "Pickup"}
              value={deliveryFee ? gbp(deliveryFee) : "Free"}
            />
          </div>
          <div className="my-4 border-t border-border" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{gbp(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Payment option card ───────────────────────────────────────────────────────

function PaymentOption({
  id,
  selected,
  onSelect,
  icon,
  title,
  description,
  accent,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${
        selected
          ? accent
            ? "border-primary bg-primary/5"
            : "border-foreground bg-muted/40"
          : "border-border hover:border-muted-foreground/40"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="payment-method"
        value={id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {/* Radio dot */}
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected
            ? accent
              ? "border-primary"
              : "border-foreground"
            : "border-muted-foreground/40"
        }`}
      >
        {selected && (
          <span
            className={`h-2 w-2 rounded-full ${accent ? "bg-primary" : "bg-foreground"}`}
          />
        )}
      </span>
      {/* Icon + text */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={selected && accent ? "text-primary" : "text-foreground"}>
            {icon}
          </span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

// ── Shared field / row components ─────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
