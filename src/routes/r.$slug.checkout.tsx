import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { store, useStore } from "@/lib/mock-store";
import { cart, useCart } from "@/lib/cart-store";
import { gbp } from "@/lib/format";
import type { Restaurant } from "@/types";
import { ChevronLeft } from "lucide-react";
import { FulfillmentSelector } from "@/components/storefront/FulfillmentSelector";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { toast } from "sonner";

export const Route = createFileRoute("/r/$slug/checkout")({
  loader: ({ params }): { slug: string } => {
    const r = store.getRestaurant(params.slug);
    if (!r) throw notFound();
    return { slug: params.slug };
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { slug } = Route.useLoaderData();
  const storeState = useStore();
  const restaurant = storeState.restaurants.find((r) => r.slug === slug) as Restaurant;
  const state = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const total = state.items.reduce((sum, i) => {
    const mods = i.modifiers.reduce((s, m) => s + m.price, 0);
    return sum + (i.price + mods) * i.quantity;
  }, 0);
  const fee = state.fulfillment === "delivery" ? 2.5 : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const items = state.items.map((i) => {
      const mods = i.modifiers.reduce((s, m) => s + m.price, 0);
      return {
        name:
          i.name +
          (i.modifiers.length
            ? ` (${i.modifiers.map((m) => m.optionName).join(", ")})`
            : ""),
        quantity: i.quantity,
        price: i.price + mods,
      };
    });
    // Simulate a brief processing delay
    setTimeout(() => {
      const order = store.createOrder({
        restaurantSlug: restaurant.slug,
        customer: name,
        email,
        phone,
        type: state.fulfillment,
        items,
        total: total + fee,
        notes:
          [notes, state.fulfillment === "delivery" && address ? `Address: ${address}` : ""]
            .filter(Boolean)
            .join(" · ") || undefined,
      });
      cart.clear();
      toast.success(`Order ${order.number} placed`);
      navigate({
        to: "/r/$slug/success",
        params: { slug: restaurant.slug },
        search: { order: order.number },
      });
    }, 700);
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Link to="/r/$slug" params={{ slug: restaurant.slug }} className="mt-3 inline-block text-primary font-medium">
            ← Back to menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {submitting && <LoadingScreen label="Placing your order…" />}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center gap-2">
          <Link to="/r/$slug" params={{ slug: restaurant.slug }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="ml-2 font-semibold">Checkout · {restaurant.name}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr,360px]">
        <form onSubmit={submit} className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Fulfilment</h2>
            <FulfillmentSelector restaurant={restaurant} />
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Contact</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" value={name} onChange={setName} required />
              <Field label="Phone" value={phone} onChange={setPhone} required />
              <div className="sm:col-span-2"><Field label="Email" type="email" value={email} onChange={setEmail} required /></div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3 capitalize">{state.fulfillment} details</h2>
            {state.fulfillment === "pickup" ? (
              <p className="text-sm text-muted-foreground">
                Pickup at <span className="font-medium text-foreground">{restaurant.address}, {restaurant.postcode}</span>. Ready in ~20 min.
              </p>
            ) : (
              <div className="grid gap-3">
                <Field label="Delivery address" value={address} onChange={setAddress} placeholder="Street, postcode" required />
              </div>
            )}
            <div className="mt-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Order notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, instructions…"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Payment</h2>
            <p className="text-sm text-muted-foreground">Card payment via Stripe (mocked for pilot).</p>
            <div className="mt-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              •••• •••• •••• 4242 · 12/29
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? "Placing order…" : `Place order · ${gbp(total + fee)}`}
          </button>
        </form>

        <aside className="rounded-2xl border border-border bg-card p-5 h-fit lg:sticky lg:top-4">
          <h2 className="font-semibold mb-3">Order summary</h2>
          <ul className="space-y-2 text-sm">
            {state.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-foreground">{i.quantity} × {i.name}</span>
                <span className="text-muted-foreground">{gbp((i.price + i.modifiers.reduce((s, m) => s + m.price, 0)) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="my-4 border-t border-border" />
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={gbp(total)} />
            <Row label={state.fulfillment === "delivery" ? "Delivery" : "Pickup"} value={fee ? gbp(fee) : "Free"} />
          </div>
          <div className="my-4 border-t border-border" />
          <div className="flex justify-between font-semibold">
            <span>Total</span><span>{gbp(total + fee)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
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
      <span>{label}</span><span className="text-foreground">{value}</span>
    </div>
  );
}