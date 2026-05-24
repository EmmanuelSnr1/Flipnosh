import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { store, useStore } from "@/lib/mock-store";
import type { Restaurant, MenuItem } from "@/types";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { FulfillmentSelector } from "@/components/storefront/FulfillmentSelector";
import { ItemDetailModal } from "@/components/storefront/ItemDetailModal";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import { useCart } from "@/lib/cart-store";
import { gbp } from "@/lib/format";
import { ShoppingBag, Plus } from "lucide-react";

export const Route = createFileRoute("/r/$slug/menu")({
  loader: ({ params }) => {
    const r = store.getRestaurant(params.slug);
    if (!r) throw notFound();
    return { slug: params.slug };
  },
  component: MenuPage,
});

function MenuPage() {
  const { slug } = Route.useLoaderData();
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === slug) as Restaurant;
  const { theme } = r;

  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const state = useCart();

  const count = state.items.reduce((s, i) => s + i.quantity, 0);
  const total = state.items.reduce((sum, i) => {
    const mods = i.modifiers.reduce((s, m) => s + m.price, 0);
    return sum + (i.price + mods) * i.quantity;
  }, 0);

  const visibleCategories = useMemo(
    () =>
      activeCategory === "all"
        ? r.menu
        : r.menu.filter((c) => c.id === activeCategory),
    [activeCategory, r.menu],
  );

  const showBottomBar = theme.cartStyle === "bottom-bar" || theme.cartStyle === "drawer";

  return (
    <StorefrontShell restaurant={r}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 pb-28">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold">Menu</h1>
          <FulfillmentSelector restaurant={r} />
        </div>

        <CategoryNavigation
          mode={theme.categoryNavigation}
          categories={r.menu}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        <div className={theme.categoryNavigation === "sidebar" ? "grid gap-6 md:grid-cols-[200px,1fr]" : ""}>
          {theme.categoryNavigation === "sidebar" && (
            <aside className="hidden md:block">
              <SidebarCategoryList
                categories={r.menu}
                active={activeCategory}
                onChange={setActiveCategory}
              />
            </aside>
          )}

          <div className="space-y-10">
            {visibleCategories.map((cat) => (
              <section key={cat.id} id={cat.id}>
                <h2 className="text-xl font-bold mb-3">{cat.name}</h2>
                <MenuList layout={theme.menuLayout} items={cat.items} onSelect={setSelected} />
              </section>
            ))}
          </div>
        </div>
      </div>

      {count > 0 && showBottomBar && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl hover:opacity-90"
        >
          <ShoppingBag className="h-4 w-4" />
          View cart · {count} {count === 1 ? "item" : "items"}
          <span className="opacity-80">·</span>
          <span>{gbp(total)}</span>
        </button>
      )}

      <ItemDetailModal item={selected} onClose={() => setSelected(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} restaurantSlug={r.slug} />
    </StorefrontShell>
  );
}

function CategoryNavigation({
  mode,
  categories,
  active,
  onChange,
}: {
  mode: Restaurant["theme"]["categoryNavigation"];
  categories: Restaurant["menu"];
  active: string;
  onChange: (id: string) => void;
}) {
  if (mode === "dropdown") {
    return (
      <select
        value={active}
        onChange={(e) => onChange(e.target.value)}
        className="mb-6 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    );
  }
  if (mode === "sidebar") {
    // Sidebar rendered separately on md+; show tabs on mobile.
    return (
      <nav className="md:hidden flex gap-1.5 overflow-x-auto pb-3 text-sm">
        {[{ id: "all", name: "All" }, ...categories].map((c) => (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full ${
              active === c.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
      </nav>
    );
  }
  // tabs (default)
  return (
    <nav className="sticky top-14 z-20 -mx-4 sm:-mx-6 bg-background/95 backdrop-blur px-4 sm:px-6 py-3 mb-2 border-b border-border flex gap-1.5 overflow-x-auto text-sm">
      {[{ id: "all", name: "All" }, ...categories].map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`shrink-0 px-3 py-1.5 rounded-full transition-colors ${
            active === c.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {c.name}
        </button>
      ))}
    </nav>
  );
}

function SidebarCategoryList({
  categories,
  active,
  onChange,
}: {
  categories: Restaurant["menu"];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="sticky top-20 space-y-1 text-sm">
      {[{ id: "all", name: "All" }, ...categories].map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`block w-full text-left px-3 py-2 rounded-lg ${
            active === c.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}

function MenuList({
  layout,
  items,
  onSelect,
}: {
  layout: Restaurant["theme"]["menuLayout"];
  items: MenuItem[];
  onSelect: (i: MenuItem) => void;
}) {
  if (layout === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((it) => (
          <ItemTile key={it.id} item={it} onSelect={onSelect} variant="grid" />
        ))}
      </div>
    );
  }
  if (layout === "card") {
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((it) => (
          <ItemTile key={it.id} item={it} onSelect={onSelect} variant="card" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((it) => (
        <ItemTile key={it.id} item={it} onSelect={onSelect} variant="list" />
      ))}
    </div>
  );
}

function ItemTile({
  item,
  onSelect,
  variant,
}: {
  item: MenuItem;
  onSelect: (i: MenuItem) => void;
  variant: "list" | "grid" | "card";
}) {
  const disabled = !item.available;

  if (variant === "list") {
    return (
      <button
        onClick={() => !disabled && onSelect(item)}
        disabled={disabled}
        className="group flex w-full gap-3 rounded-2xl border border-border bg-card p-3 text-left hover:border-primary/40 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold leading-snug">{item.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          <p className="mt-2 text-sm font-semibold">{gbp(item.price)}</p>
          {disabled && <p className="mt-1 text-xs text-muted-foreground">Sold out</p>}
        </div>
        {item.image && (
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            {!disabled && (
              <span className="absolute bottom-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Plus className="h-4 w-4" />
              </span>
            )}
          </div>
        )}
      </button>
    );
  }

  // grid & card share image-on-top
  return (
    <button
      onClick={() => !disabled && onSelect(item)}
      disabled={disabled}
      className={`group block w-full text-left rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow disabled:opacity-60 disabled:cursor-not-allowed ${
        variant === "card" ? "shadow-sm" : ""
      }`}
    >
      <div className={`bg-muted overflow-hidden ${variant === "card" ? "aspect-[16/10]" : "aspect-square"}`}>
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
      </div>
      <div className={variant === "card" ? "p-5" : "p-3"}>
        <h3 className="font-semibold leading-snug">{item.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold">{gbp(item.price)}</span>
          {disabled && <span className="text-xs text-muted-foreground">Sold out</span>}
        </div>
      </div>
    </button>
  );
}