import { useSyncExternalStore } from "react";
import type {
  Restaurant,
  Order,
  OrderStatus,
  QRCampaign,
  Customer,
  StripeStatus,
  MenuItem,
  RestaurantThemeConfig,
  RestaurantBranding,
  FulfilmentSettings,
  OnboardingState,
  MenuCategory,
} from "@/types";
import { allRestaurants } from "@/lib/mock-data/restaurants";
import { mockOrders } from "@/lib/mock-data/orders";
import { mockCampaigns } from "@/lib/mock-data/campaigns";
import { mockCustomers } from "@/lib/mock-data/customers";

type State = {
  restaurants: Restaurant[];
  orders: Order[];
  campaigns: QRCampaign[];
  customers: Customer[];
  stripeStatus: StripeStatus;
  orderCounter: number;
  onboarding: OnboardingState;
};

let state: State = {
  restaurants: allRestaurants,
  orders: mockOrders,
  campaigns: mockCampaigns,
  customers: mockCustomers,
  stripeStatus: "connected",
  orderCounter: 1043,
  onboarding: {
    currentStep: 1,
    completedSteps: [],
    launched: false,
  },
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  notify();
};

function mapRestaurant(slug: string, fn: (r: Restaurant) => Restaurant) {
  set({
    restaurants: state.restaurants.map((r) => (r.slug === slug ? fn(r) : r)),
  });
}

export const store = {
  getState: () => state,
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  getRestaurant: (slug: string) =>
    state.restaurants.find((r) => r.slug === slug),
  getRestaurantById: (id: string) =>
    state.restaurants.find((r) => r.id === id),

  updateRestaurant(slug: string, patch: Partial<Restaurant>) {
    mapRestaurant(slug, (r) => ({ ...r, ...patch }));
  },

  toggleItemAvailability(slug: string, itemId: string) {
    mapRestaurant(slug, (r) => ({
      ...r,
      menu: r.menu.map((c) => ({
        ...c,
        items: c.items.map((i) =>
          i.id === itemId ? { ...i, available: !i.available } : i,
        ),
      })),
    }));
  },

  updateMenuItem(slug: string, itemId: string, patch: Partial<MenuItem>) {
    mapRestaurant(slug, (r) => ({
      ...r,
      menu: r.menu.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
      })),
    }));
  },

  setMenuItemImage(slug: string, itemId: string, image: string | undefined) {
    this.updateMenuItem(slug, itemId, { image });
  },

  updateTheme(slug: string, patch: Partial<RestaurantThemeConfig>) {
    mapRestaurant(slug, (r) => ({ ...r, theme: { ...r.theme, ...patch } }));
  },

  updateBranding(slug: string, patch: Partial<RestaurantBranding>) {
    mapRestaurant(slug, (r) => ({
      ...r,
      branding: { ...r.branding, ...patch },
    }));
  },

  updateFulfilment(slug: string, patch: Partial<FulfilmentSettings>) {
    mapRestaurant(slug, (r) => ({
      ...r,
      fulfilment: {
        pickup: { ...r.fulfilment.pickup, ...(patch.pickup ?? {}) },
        delivery: { ...r.fulfilment.delivery, ...(patch.delivery ?? {}) },
      },
      pickupEnabled: patch.pickup?.enabled ?? r.pickupEnabled,
      deliveryEnabled: patch.delivery?.enabled ?? r.deliveryEnabled,
    }));
  },

  addCategory(slug: string, name: string) {
    const cat: MenuCategory = {
      id: `cat_${Date.now()}`,
      name,
      items: [],
    };
    mapRestaurant(slug, (r) => ({ ...r, menu: [...r.menu, cat] }));
    return cat;
  },

  removeCategory(slug: string, categoryId: string) {
    mapRestaurant(slug, (r) => ({
      ...r,
      menu: r.menu.filter((c) => c.id !== categoryId),
    }));
  },

  removeMenuItem(slug: string, itemId: string) {
    mapRestaurant(slug, (r) => ({
      ...r,
      menu: r.menu.map((c) => ({
        ...c,
        items: c.items.filter((i) => i.id !== itemId),
      })),
    }));
  },

  moveMenuItem(slug: string, categoryId: string, itemId: string, dir: -1 | 1) {
    mapRestaurant(slug, (r) => ({
      ...r,
      menu: r.menu.map((c) => {
        if (c.id !== categoryId) return c;
        const idx = c.items.findIndex((i) => i.id === itemId);
        const next = idx + dir;
        if (idx < 0 || next < 0 || next >= c.items.length) return c;
        const items = [...c.items];
        [items[idx], items[next]] = [items[next], items[idx]];
        return { ...c, items };
      }),
    }));
  },

  updateOnboarding(patch: Partial<OnboardingState>) {
    set({ onboarding: { ...state.onboarding, ...patch } });
  },

  completeStep(step: number) {
    const completed = state.onboarding.completedSteps.includes(step)
      ? state.onboarding.completedSteps
      : [...state.onboarding.completedSteps, step];
    set({ onboarding: { ...state.onboarding, completedSteps: completed } });
  },

  launchStorefront() {
    set({
      onboarding: {
        ...state.onboarding,
        launched: true,
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
      },
    });
  },

  addMenuItem(slug: string, categoryId: string, item: MenuItem) {
    mapRestaurant(slug, (r) => ({
      ...r,
      menu: r.menu.map((c) =>
        c.id === categoryId ? { ...c, items: [...c.items, item] } : c,
      ),
    }));
  },

  updateOrderStatus(id: string, status: OrderStatus) {
    set({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    });
  },

  createOrder(input: {
    restaurantSlug: string;
    customer: string;
    email: string;
    phone: string;
    type: "pickup" | "delivery";
    items: { name: string; quantity: number; price: number }[];
    total: number;
    notes?: string;
  }): Order {
    const number = `#${state.orderCounter}`;
    const order: Order = {
      id: `ord_${Date.now()}`,
      number,
      customer: input.customer,
      email: input.email,
      phone: input.phone,
      type: input.type,
      status: "pending",
      total: input.total,
      createdAt: "just now",
      notes: input.notes,
      items: input.items,
    };
    set({
      orders: [order, ...state.orders],
      orderCounter: state.orderCounter + 1,
    });
    return order;
  },

  setStripeStatus(s: StripeStatus) {
    set({ stripeStatus: s });
  },
};

export function useStore(): State {
  return useSyncExternalStore(
    store.subscribe,
    () => state,
    () => state,
  );
}

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing", "rejected"],
  preparing: ["ready", "rejected"],
  ready: ["completed"],
  completed: [],
  rejected: [],
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  rejected: "Rejected",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  preparing: "bg-amber-100 text-amber-700",
  ready: "bg-emerald-100 text-emerald-700",
  completed: "bg-zinc-100 text-zinc-700",
  rejected: "bg-red-100 text-red-700",
};