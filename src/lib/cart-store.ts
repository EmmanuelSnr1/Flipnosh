import { useSyncExternalStore } from "react";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  restaurantSlug: string | null;
  fulfillment: "pickup" | "delivery";
};

let state: CartState = {
  items: [],
  restaurantSlug: null,
  fulfillment: "pickup",
};

const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function setState(next: Partial<CartState>) {
  state = { ...state, ...next };
  notify();
}

export const cart = {
  getState: () => state,
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  setRestaurant(slug: string) {
    if (state.restaurantSlug !== slug) {
      setState({ restaurantSlug: slug, items: [] });
    }
  },
  setFulfillment(f: "pickup" | "delivery") {
    setState({ fulfillment: f });
  },
  add(item: Omit<CartItem, "id">) {
    const id = `${item.menuItemId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setState({ items: [...state.items, { ...item, id }] });
  },
  remove(id: string) {
    setState({ items: state.items.filter((i) => i.id !== id) });
  },
  updateQty(id: string, qty: number) {
    if (qty <= 0) return cart.remove(id);
    setState({
      items: state.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    });
  },
  clear() {
    setState({ items: [] });
  },
  total() {
    return state.items.reduce((sum, i) => {
      const mods = i.modifiers.reduce((s, m) => s + m.price, 0);
      return sum + (i.price + mods) * i.quantity;
    }, 0);
  },
  count() {
    return state.items.reduce((s, i) => s + i.quantity, 0);
  },
};

export function useCart() {
  return useSyncExternalStore(
    cart.subscribe,
    () => state,
    () => state,
  );
}