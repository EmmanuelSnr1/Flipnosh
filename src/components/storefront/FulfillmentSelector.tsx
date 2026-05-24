import { useCart, cart } from "@/lib/cart-store";
import type { Restaurant } from "@/types";
import { useEffect } from "react";

export function FulfillmentSelector({ restaurant }: { restaurant?: Restaurant }) {
  const state = useCart();
  const options: Array<"pickup" | "delivery"> = [];
  if (!restaurant || restaurant.pickupEnabled) options.push("pickup");
  if (!restaurant || restaurant.deliveryEnabled) options.push("delivery");

  // Snap to a valid option if the current one isn't available.
  useEffect(() => {
    if (options.length > 0 && !options.includes(state.fulfillment)) {
      cart.setFulfillment(options[0]);
    }
  }, [options.join(","), state.fulfillment]);

  if (options.length === 0) return null;

  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => cart.setFulfillment(opt)}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors capitalize ${
            state.fulfillment === opt
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}