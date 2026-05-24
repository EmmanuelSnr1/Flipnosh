import { useCart, cart } from "@/lib/cart-store";
import { gbp } from "@/lib/format";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CartDrawer({ open, onClose, restaurantSlug }: { open: boolean; onClose: () => void; restaurantSlug: string }) {
  const state = useCart();
  const total = cart.total();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-card shadow-2xl flex flex-col transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Your order</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </header>

        {state.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {state.items.map((i) => {
              const mods = i.modifiers.reduce((s, m) => s + m.price, 0);
              const lineTotal = (i.price + mods) * i.quantity;
              return (
                <div key={i.id} className="rounded-2xl border border-border p-3">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{i.name}</p>
                      {i.modifiers.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {i.modifiers.map((m) => m.optionName).join(", ")}
                        </p>
                      )}
                      {i.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{i.notes}"</p>}
                    </div>
                    <span className="font-semibold whitespace-nowrap">{gbp(lineTotal)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-border">
                      <button onClick={() => cart.updateQty(i.id, i.quantity - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
                      <span className="w-7 text-center text-xs font-medium">{i.quantity}</span>
                      <button onClick={() => cart.updateQty(i.id, i.quantity + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => cart.remove(i.id)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {state.items.length > 0 && (
          <footer className="border-t border-border p-4 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span><span>{gbp(total)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span><span>{gbp(total)}</span>
            </div>
            <Link
              to="/r/$slug/checkout"
              params={{ slug: restaurantSlug }}
              onClick={onClose}
              className="block w-full rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              Checkout · {gbp(total)}
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}