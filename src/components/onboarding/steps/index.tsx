import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { store, useStore } from "@/stores/mock-store";
import type {
  CartStyle,
  CategoryNav,
  HeroLayout,
  MenuLayout,
  ThemeName,
  MenuItem,
  StorefrontPageId,
} from "@/types";
import { gbp } from "@/lib/utils/format";
import { toast } from "sonner";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ImagePlus,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Lock,
  Copy,
  ExternalLink,
  CreditCard,
  Building2,
  Landmark,
  Wallet,
  ShieldCheck,
  Share2,
  Truck,
  Store,
  Check,
  X,
  Edit2,
} from "lucide-react";

const SLUG = "naturalfingers";

/* ---------------- Step 1: Welcome ---------------- */

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 sm:p-10">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">FlipNosh setup</p>
          <h2 className="text-2xl font-bold">Welcome to FlipNosh 👋</h2>
        </div>
      </div>
      <p className="mt-5 text-muted-foreground leading-relaxed">
        We'll help you launch your own branded direct-ordering storefront in just a few steps —
        no commissions, no marketplace listings, just your own shop online.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <InfoTile
          icon={<Clock className="h-5 w-5" />}
          title="~7 minutes"
          body="Average time to launch your storefront."
        />
        <InfoTile
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Direct orders, day one"
          body="Take pickup and delivery orders from your own site, with payouts to your bank."
        />
      </div>

      <div className="mt-6 rounded-2xl bg-muted/40 p-5">
        <p className="text-sm font-semibold">What you'll set up</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Restaurant info, hours and brand</li>
          <li>• Storefront theme, colours and layout</li>
          <li>• Menu, categories and modifiers</li>
          <li>• Pickup and delivery rules</li>
          <li>• Stripe payouts (mock for pilot)</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90"
      >
        Start setup
      </button>
    </div>
  );
}

function InfoTile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 text-primary">{icon}<p className="font-semibold text-foreground">{title}</p></div>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

/* ---------------- Step 2: Restaurant info ---------------- */

const CUISINES = [
  "Burgers", "Pizza", "Chicken", "Kebab", "Indian", "Chinese", "Thai",
  "Sushi", "Mexican", "Mediterranean", "Caribbean", "Italian", "Vegan", "Cafe", "Other",
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function RestaurantInfoStep({ restaurantId }: { restaurantId?: string }) {
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;

  const [openDays, setOpenDays] = useState<string[]>(DAYS);
  const [openTime, setOpenTime] = useState("11:30");
  const [closeTime, setCloseTime] = useState("22:00");
  const [cuisine, setCuisine] = useState("Chicken");

  useEffect(() => {
    // Reflect hours string when times change
    const hours = `${openDays[0]}–${openDays[openDays.length - 1]} · ${openTime} – ${closeTime}`;
    store.updateRestaurant(SLUG, { hours });
  }, [openDays, openTime, closeTime]);

  const toggleDay = (d: string) => {
    setOpenDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  };

  return (
    <>
      <Section title="Restaurant details">
        <Grid>
          <Text label="Restaurant name" value={r.name} onChange={(v) => store.updateRestaurant(SLUG, { name: v })} />
          <SelectField label="Cuisine type" value={cuisine} onChange={setCuisine} options={CUISINES} />
          <Text label="Phone" value={r.phone} onChange={(v) => store.updateRestaurant(SLUG, { phone: v })} />
          <Text label="Email" value={r.branding.email ?? ""} onChange={(v) => store.updateBranding(SLUG, { email: v })} />
          <Text label="Address" value={r.address} onChange={(v) => store.updateRestaurant(SLUG, { address: v })} className="sm:col-span-2" />
          <Text label="Postcode" value={r.postcode} onChange={(v) => store.updateRestaurant(SLUG, { postcode: v })} />
          <Text label="City" value={r.city} onChange={(v) => store.updateRestaurant(SLUG, { city: v })} />
        </Grid>
        <Text label="Tagline" value={r.branding.tagline} onChange={(v) => store.updateBranding(SLUG, { tagline: v })} />
        <Textarea label="Description" value={r.branding.description} onChange={(v) => store.updateBranding(SLUG, { description: v })} />
      </Section>

      <Section title="Opening hours">
        <p className="text-xs text-muted-foreground -mt-1 mb-2">Tap the days you're open.</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = openDays.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <Grid className="mt-4">
          <Text label="Opens" type="time" value={openTime} onChange={setOpenTime} />
          <Text label="Closes" type="time" value={closeTime} onChange={setCloseTime} />
        </Grid>
      </Section>

      <Section title="Socials (optional)">
        <Grid>
          <Text
            label="Instagram"
            value={r.branding.socials?.instagram ?? ""}
            onChange={(v) => store.updateBranding(SLUG, { socials: { ...r.branding.socials, instagram: v } })}
            placeholder="@yourshop"
          />
          <Text
            label="TikTok"
            value={r.branding.socials?.tiktok ?? ""}
            onChange={(v) => store.updateBranding(SLUG, { socials: { ...r.branding.socials, tiktok: v } })}
            placeholder="@yourshop"
          />
          <Text
            label="Facebook"
            value={r.branding.socials?.facebook ?? ""}
            onChange={(v) => store.updateBranding(SLUG, { socials: { ...r.branding.socials, facebook: v } })}
            placeholder="yourshop"
          />
        </Grid>
      </Section>

      <Section title="Brand imagery">
        <div className="grid gap-4 sm:grid-cols-2">
          {restaurantId ? (
            <ImageUpload
              label="Logo"
              currentUrl={r.branding.logoUrl}
              bucket="restaurant-assets"
              path={`${restaurantId}/logo`}
              aspect="aspect-square"
              onUploaded={(url) => store.updateBranding(SLUG, { logoUrl: url })}
              onCleared={() => store.updateBranding(SLUG, { logoUrl: undefined })}
            />
          ) : (
            <ImageDrop
              label="Logo"
              preview={r.branding.logoUrl}
              onPick={(e) => {
                const file = e.target.files?.[0];
                if (file) store.updateBranding(SLUG, { logoUrl: URL.createObjectURL(file) });
              }}
              onClear={() => store.updateBranding(SLUG, { logoUrl: undefined })}
              aspect="aspect-square"
            />
          )}
          {restaurantId ? (
            <ImageUpload
              label="Cover / hero image"
              currentUrl={r.branding.heroImageUrl}
              bucket="restaurant-assets"
              path={`${restaurantId}/hero`}
              aspect="aspect-[16/9]"
              onUploaded={(url) => store.updateBranding(SLUG, { heroImageUrl: url })}
              onCleared={() => store.updateBranding(SLUG, { heroImageUrl: undefined })}
            />
          ) : (
            <ImageDrop
              label="Cover / hero image"
              preview={r.branding.heroImageUrl}
              onPick={(e) => {
                const file = e.target.files?.[0];
                if (file) store.updateBranding(SLUG, { heroImageUrl: URL.createObjectURL(file) });
              }}
              onClear={() => store.updateBranding(SLUG, { heroImageUrl: undefined })}
              aspect="aspect-[16/9]"
            />
          )}
        </div>
      </Section>
    </>
  );
}

/* ---------------- Step 3: Design ---------------- */

const THEMES: { id: ThemeName; name: string; tagline: string }[] = [
  { id: "classic", name: "Classic", tagline: "Strong hero, traditional menu. Kebab, pizza, Indian." },
  { id: "modern", name: "Modern", tagline: "Sleek cards, spacious. Sushi, burgers, cafés." },
  { id: "bold", name: "Bold", tagline: "Big type, high-impact. Street food, grill, wings." },
];

const PAGES: { id: StorefrontPageId; name: string; description: string; locked?: boolean }[] = [
  { id: "home", name: "Home", description: "Hero, intro, featured items, CTA." },
  { id: "menu", name: "Menu / Order", description: "Categories, items, cart, checkout." },
  { id: "contact", name: "Contact / Info", description: "Address, hours, map, social links." },
  { id: "about", name: "About", description: "Your story, team, kitchen.", locked: true },
  { id: "offers", name: "Offers / Loyalty", description: "Promotions and rewards.", locked: true },
];

export function DesignStep() {
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;
  const t = r.theme;

  const togglePage = (id: StorefrontPageId, locked?: boolean) => {
    if (locked) {
      toast.error("Upgrade to Pro to unlock this page");
      return;
    }
    const next = t.enabledPages.includes(id) ? t.enabledPages.filter((p) => p !== id) : [...t.enabledPages, id];
    store.updateTheme(SLUG, { enabledPages: next });
  };

  return (
    <>
      <Section title="Theme">
        <div className="grid gap-3 sm:grid-cols-3">
          {THEMES.map((th) => {
            const active = t.themeName === th.id;
            return (
              <button
                key={th.id}
                onClick={() => store.updateTheme(SLUG, { themeName: th.id })}
                className={`text-left rounded-2xl border p-4 transition-all ${
                  active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{th.name}</p>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{th.tagline}</p>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Colours">
        <div className="grid gap-3 sm:grid-cols-2">
          <Color label="Primary" value={t.primaryColor} onChange={(v) => store.updateTheme(SLUG, { primaryColor: v })} />
          <Color label="Accent" value={t.accentColor} onChange={(v) => store.updateTheme(SLUG, { accentColor: v })} />
          <Color label="Background" value={t.backgroundColor} onChange={(v) => store.updateTheme(SLUG, { backgroundColor: v })} />
          <Color label="Button" value={t.buttonColor} onChange={(v) => store.updateTheme(SLUG, { buttonColor: v })} />
          <Color label="Text" value={t.textColor} onChange={(v) => store.updateTheme(SLUG, { textColor: v })} />
        </div>
      </Section>

      <Section title="Layout">
        <Pills<HeroLayout>
          label="Hero style"
          value={t.heroLayout}
          onChange={(v) => store.updateTheme(SLUG, { heroLayout: v })}
          options={[
            { value: "image", label: "Image background" },
            { value: "split", label: "Split image / text" },
            { value: "minimal", label: "Minimal" },
          ]}
        />
        <Pills<MenuLayout>
          label="Menu layout"
          value={t.menuLayout}
          onChange={(v) => store.updateTheme(SLUG, { menuLayout: v })}
          options={[
            { value: "list", label: "List" },
            { value: "grid", label: "Grid" },
            { value: "card", label: "Cards" },
          ]}
        />
        <Pills<CategoryNav>
          label="Category navigation"
          value={t.categoryNavigation}
          onChange={(v) => store.updateTheme(SLUG, { categoryNavigation: v })}
          options={[
            { value: "tabs", label: "Sticky tabs" },
            { value: "sidebar", label: "Sidebar" },
            { value: "dropdown", label: "Dropdown" },
          ]}
        />
        <Pills<CartStyle>
          label="Cart style"
          value={t.cartStyle}
          onChange={(v) => store.updateTheme(SLUG, { cartStyle: v })}
          options={[
            { value: "drawer", label: "Drawer" },
            { value: "sidebar", label: "Sidebar" },
            { value: "bottom-bar", label: "Mobile bottom bar" },
          ]}
        />
      </Section>

      <Section title="Homepage sections">
        <Toggle label="Featured items" checked={t.showFeaturedItems} onChange={(v) => store.updateTheme(SLUG, { showFeaturedItems: v })} />
        <Toggle label="Opening hours" checked={t.showOpeningHours} onChange={(v) => store.updateTheme(SLUG, { showOpeningHours: v })} />
        <Toggle label="Pickup / delivery badges" checked={t.showBadges} onChange={(v) => store.updateTheme(SLUG, { showBadges: v })} />
        <Toggle label="Customer reviews (placeholder)" checked={t.showReviews} onChange={(v) => store.updateTheme(SLUG, { showReviews: v })} />
        <div className="pt-2">
          <Text label="CTA button text" value={t.ctaText} onChange={(v) => store.updateTheme(SLUG, { ctaText: v })} placeholder="Order Now" />
        </div>
      </Section>

      <Section title="Storefront pages">
        <div className="space-y-2">
          {PAGES.map((p) => {
            const enabled = t.enabledPages.includes(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-start justify-between gap-3 rounded-2xl border p-3 ${
                  p.locked ? "bg-muted/40 border-dashed" : "border-border bg-card"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{p.name}</p>
                    {p.locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                        <Lock className="h-2.5 w-2.5" /> Pro
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>
                  {p.locked && (
                    <button
                      onClick={() => toast.error("Upgrade to Pro to unlock this page")}
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      Upgrade to unlock →
                    </button>
                  )}
                </div>
                <button
                  onClick={() => togglePage(p.id, p.locked)}
                  disabled={p.locked}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full disabled:opacity-50 disabled:cursor-not-allowed ${
                    enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

/* ---------------- Step 4: Menu ---------------- */

export function MenuStep() {
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;
  const [newCat, setNewCat] = useState("");

  const addCat = () => {
    if (!newCat.trim()) return;
    store.addCategory(SLUG, newCat.trim());
    setNewCat("");
  };

  return (
    <>
      <Section title="Menu categories">
        <p className="text-xs text-muted-foreground -mt-1 mb-2">
          Group items into sections like Burgers, Wings, Drinks, Sides.
        </p>
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category name"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button onClick={addCat} className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </Section>

      <div className="space-y-5">
        {r.menu.map((cat) => (
          <MenuCategoryEditor key={cat.id} categoryId={cat.id} name={cat.name} items={cat.items} />
        ))}
        {r.menu.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No categories yet — add one above.</p>
        )}
      </div>
    </>
  );
}

function MenuCategoryEditor({
  categoryId, name, items,
}: { categoryId: string; name: string; items: MenuItem[] }) {
  const [adding, setAdding] = useState(false);
  const [iName, setIName] = useState("");
  const [iPrice, setIPrice] = useState("");

  const add = () => {
    const p = parseFloat(iPrice);
    if (!iName.trim() || Number.isNaN(p)) {
      toast.error("Name and valid price required");
      return;
    }
    store.addMenuItem(SLUG, categoryId, {
      id: `item_${Date.now()}`,
      name: iName.trim(),
      description: "",
      price: p,
      category: categoryId,
      available: true,
    });
    setIName("");
    setIPrice("");
    setAdding(false);
    toast.success("Item added");
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-xs text-muted-foreground">{items.length} items</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAdding((s) => !s)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
            <Plus className="h-3.5 w-3.5" /> Item
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete category "${name}"?`)) store.removeCategory(SLUG, categoryId);
            }}
            title="Delete category"
            className="text-muted-foreground hover:text-destructive p-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="divide-y divide-border">
        {items.map((it, idx) => (
          <MenuItemRow
            key={it.id}
            item={it}
            categoryId={categoryId}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
          />
        ))}
        {adding && (
          <div className="bg-muted/30 p-3 grid gap-2 sm:grid-cols-[1fr,120px,auto]">
            <input autoFocus value={iName} onChange={(e) => setIName(e.target.value)} placeholder="Item name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input value={iPrice} onChange={(e) => setIPrice(e.target.value)} type="number" step="0.01" placeholder="0.00" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={add} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Add</button>
              <button onClick={() => setAdding(false)} className="rounded-full bg-muted px-3 py-1.5 text-xs">Cancel</button>
            </div>
          </div>
        )}
        {items.length === 0 && !adding && (
          <p className="p-4 text-xs text-muted-foreground italic">No items yet.</p>
        )}
      </div>
    </section>
  );
}

function MenuItemRow({
  item, categoryId, isFirst, isLast,
}: { item: MenuItem; categoryId: string; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description);
  const [price, setPrice] = useState(item.price.toString());

  const save = () => {
    const p = parseFloat(price);
    if (!name.trim() || Number.isNaN(p)) {
      toast.error("Name and valid price required");
      return;
    }
    store.updateMenuItem(SLUG, item.id, { name: name.trim(), description, price: p });
    setEditing(false);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    store.setMenuItemImage(SLUG, item.id, URL.createObjectURL(file));
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="flex gap-3 items-start">
        <label className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-border bg-muted cursor-pointer">
          <img
            src={item.image ?? "/food-placeholder.png"}
            alt={item.name}
            className={`h-full w-full ${item.image ? "object-cover" : "object-contain p-2 opacity-40"}`}
          />
          <input type="file" accept="image/*" className="sr-only" onChange={onPick} />
        </label>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-[1fr,100px]">
                <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={save} className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"><Check className="h-3 w-3 inline mr-1" /> Save</button>
                <button onClick={() => setEditing(false)} className="rounded-full bg-muted px-3 py-1.5 text-xs"><X className="h-3 w-3 inline mr-1" /> Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
                </div>
                <span className="text-sm font-semibold whitespace-nowrap">{gbp(item.price)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <button onClick={() => store.toggleItemAvailability(SLUG, item.id)} className={`px-2 py-0.5 rounded-full ${item.available ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                  {item.available ? "Available" : "Sold out"}
                </button>
                <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Edit2 className="h-3 w-3" /> Edit</button>
                <button onClick={() => store.removeMenuItem(SLUG, item.id)} className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /></button>
                <div className="ml-auto flex">
                  <button disabled={isFirst} onClick={() => store.moveMenuItem(SLUG, categoryId, item.id, -1)} className="p-1 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button disabled={isLast} onClick={() => store.moveMenuItem(SLUG, categoryId, item.id, 1)} className="p-1 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 5: Fulfilment ---------------- */

export function FulfilmentStep() {
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;
  const f = r.fulfilment;

  return (
    <>
      <Section title="Pickup">
        <Toggle
          label="Allow customers to pick up orders"
          checked={f.pickup.enabled}
          onChange={(v) => store.updateFulfilment(SLUG, { pickup: { ...f.pickup, enabled: v } })}
        />
        <p className="text-xs text-muted-foreground -mt-1">Customers collect from your address. No driver needed.</p>
        {f.pickup.enabled && (
          <NumberField label="Estimated prep time (minutes)" value={f.pickup.prepTimeMinutes} onChange={(v) => store.updateFulfilment(SLUG, { pickup: { ...f.pickup, prepTimeMinutes: v } })} />
        )}
      </Section>

      <Section title="Delivery">
        <Toggle
          label="Offer delivery"
          checked={f.delivery.enabled}
          onChange={(v) => store.updateFulfilment(SLUG, { delivery: { ...f.delivery, enabled: v } })}
        />
        <p className="text-xs text-muted-foreground -mt-1">
          You can use your own drivers — FlipNosh doesn't operate a delivery fleet.
        </p>

        {f.delivery.enabled && (
          <>
            <Grid>
              <NumberField label="Delivery radius (miles)" value={f.delivery.radiusMiles} step={0.5} onChange={(v) => store.updateFulfilment(SLUG, { delivery: { ...f.delivery, radiusMiles: v } })} />
              <NumberField label="Delivery fee (£)" value={f.delivery.fee} step={0.5} onChange={(v) => store.updateFulfilment(SLUG, { delivery: { ...f.delivery, fee: v } })} />
              <NumberField label="Minimum order (£)" value={f.delivery.minimumOrder} step={1} onChange={(v) => store.updateFulfilment(SLUG, { delivery: { ...f.delivery, minimumOrder: v } })} />
              <NumberField label="Estimated delivery time (mins)" value={f.delivery.etaMinutes} onChange={(v) => store.updateFulfilment(SLUG, { delivery: { ...f.delivery, etaMinutes: v } })} />
            </Grid>

            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Delivery area</p>
              </div>
              <div className="mt-3 aspect-[16/9] rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Map placeholder · {f.delivery.radiusMiles} mi radius from {r.postcode}
              </div>
            </div>
          </>
        )}
      </Section>
    </>
  );
}

/* ---------------- Step 6: Payments ---------------- */

/** Dispatcher — keeps the hook call order stable regardless of which variant renders. */
export function PaymentsStep({ restaurantId }: { restaurantId?: string }) {
  return restaurantId
    ? <PaymentsStepReal restaurantId={restaurantId} />
    : <PaymentsStepMock />;
}

/** Real path: shown when a real restaurantId is available (post-signup). */
function PaymentsStepReal({ restaurantId }: { restaurantId: string }) {
  const [connecting, setConnecting] = useState(false);

  const doConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      // Supabase session lives in browser localStorage — pass the token explicitly
      const { supabase: sbClient } = await import("@/lib/supabase/client");
      const { data: { session } } = await sbClient.auth.getSession();
      if (!session?.access_token) {
        toast.error("Not signed in — please log in and try again");
        setConnecting(false);
        return;
      }

      const { createConnectAccountLink } = await import("@/api/stripe-connect");
      const { url } = await createConnectAccountLink({
        data: { restaurantId, accessToken: session.access_token },
      });
      window.location.href = url; // Redirect to Stripe — page will leave
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start Stripe onboarding");
      setConnecting(false);
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Connect Stripe</p>
            <p className="text-xs text-muted-foreground">
              FlipNosh uses Stripe to securely send payouts directly to your bank.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
          <StripeStep icon={<Building2 className="h-4 w-4" />} title="Business details" body="Legal name, trading address, VAT (if applicable)." />
          <StripeStep icon={<ShieldCheck className="h-4 w-4" />} title="Verification" body="ID check on the business owner." />
          <StripeStep icon={<Landmark className="h-4 w-4" />} title="Bank account" body="UK current account — payouts arrive in 2–3 business days." />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => void doConnect()}
            disabled={connecting}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {connecting ? "Opening Stripe…" : "Connect Stripe"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        You can skip this step and connect Stripe later from the dashboard Payments page. Customers can still place orders — they'll pay on collection or delivery until payments are set up.
      </div>
    </>
  );
}

/** Mock path: shown in demo / preview mode (no real account yet). */
function PaymentsStepMock() {
  const { stripeStatus } = useStore();
  const [busy, setBusy] = useState(false);

  const start = () => {
    setBusy(true);
    store.setStripeStatus("onboarding");
    setTimeout(() => setBusy(false), 600);
    toast("Stripe onboarding started — complete verification to receive payouts.");
  };

  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Connect Stripe</p>
            <p className="text-xs text-muted-foreground">FlipNosh uses Stripe to securely send payouts directly to your bank.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
          <StripeStep icon={<Building2 className="h-4 w-4" />} title="Business details" body="Legal name, trading address, VAT (if applicable)." />
          <StripeStep icon={<ShieldCheck className="h-4 w-4" />} title="Verification" body="ID check on the business owner." />
          <StripeStep icon={<Landmark className="h-4 w-4" />} title="Bank account" body="UK current account — payouts arrive in 2-3 business days." />
        </div>

        <div className="mt-5 rounded-2xl border border-border p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Stripe status</p>
              <p className="text-xs text-muted-foreground capitalize">{stripeStatus.replace("_", " ")}</p>
            </div>
          </div>
          <StripeBadge status={stripeStatus} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {stripeStatus === "not_started" && (
            <button disabled={busy} onClick={start} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              Start onboarding
            </button>
          )}
          {stripeStatus === "onboarding" && (
            <>
              <button
                onClick={() => { store.setStripeStatus("connected"); toast.success("Stripe connected — payouts enabled."); }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Simulate completion
              </button>
              <button onClick={() => store.setStripeStatus("not_started")} className="rounded-full bg-muted px-5 py-2.5 text-sm font-medium">
                Cancel
              </button>
            </>
          )}
          {stripeStatus === "connected" && (
            <button onClick={() => { store.setStripeStatus("not_started"); toast("Stripe disconnected."); }} className="rounded-full bg-muted px-5 py-2.5 text-sm font-medium">
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        Demo mode — Stripe is simulated here. Real verification happens when you connect your actual account.
      </div>
    </>
  );
}

function StripeStep({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 text-primary">{icon}<p className="text-sm font-semibold text-foreground">{title}</p></div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function StripeBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    not_started: { label: "Not started", cls: "bg-zinc-100 text-zinc-700" },
    onboarding: { label: "In progress", cls: "bg-amber-100 text-amber-700" },
    connected: { label: "Connected", cls: "bg-emerald-100 text-emerald-700" },
  };
  const v = map[status] ?? map.not_started;
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${v.cls}`}>{v.label}</span>;
}

/* ---------------- Step 7: Preview & Launch ---------------- */

export function PreviewStep({
  onLaunch,
  launchLoading = false,
}: {
  onLaunch: () => void;
  launchLoading?: boolean;
}) {
  const { restaurants, stripeStatus } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;
  const f = r.fulfilment;
  const itemCount = r.menu.reduce((s, c) => s + c.items.length, 0);

  const checklist = [
    { ok: !!r.name && !!r.phone, label: "Restaurant info complete" },
    { ok: r.theme.enabledPages.length >= 3, label: "Theme & pages configured" },
    { ok: itemCount > 0, label: `Menu added (${itemCount} items)` },
    { ok: f.pickup.enabled || f.delivery.enabled, label: "Fulfilment enabled" },
    { ok: stripeStatus === "connected", label: "Payments connected" },
  ];

  const allDone = checklist.every((c) => c.ok);

  return (
    <>
      <Section title="Pre-launch checklist">
        <ul className="space-y-2">
          {checklist.map((c, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center ${c.ok ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                {c.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              </span>
              <span className="text-sm">{c.label}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Summary">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <SummaryCard icon={<Store className="h-4 w-4" />} title={r.name} body={`${r.address}, ${r.postcode}`} />
          <SummaryCard icon={<Truck className="h-4 w-4" />} title="Fulfilment" body={`${f.pickup.enabled ? "Pickup" : ""}${f.pickup.enabled && f.delivery.enabled ? " · " : ""}${f.delivery.enabled ? `Delivery (${f.delivery.radiusMiles} mi)` : ""}`} />
          <SummaryCard icon={<Wallet className="h-4 w-4" />} title="Payments" body={stripeStatus === "connected" ? "Stripe connected" : "Not connected"} />
          <SummaryCard icon={<Sparkles className="h-4 w-4" />} title="Theme" body={`${r.theme.themeName} · ${r.theme.menuLayout}`} />
        </div>
      </Section>

      <div className="flex flex-wrap gap-3">
        <a
          href={`/r/${r.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          <ExternalLink className="h-4 w-4" /> Place test order
        </a>
        <button
          onClick={onLaunch}
          disabled={!allDone || launchLoading}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {launchLoading ? "Launching…" : "🚀 Launch storefront"}
        </button>
      </div>
      {!allDone && (
        <p className="text-xs text-muted-foreground">Complete the checklist above before launching.</p>
      )}
    </>
  );
}

function SummaryCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<p className="text-xs uppercase tracking-wider">{title}</p></div>
      <p className="mt-1 text-sm font-medium">{body || "—"}</p>
    </div>
  );
}

/* ---------------- Step 8: Completed ---------------- */

export function CompletedStep({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  const { restaurants, stripeStatus } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;
  const url = `flipnosh.com/r/${r.slug}`;
  const itemCount = r.menu.reduce((s, c) => s + c.items.length, 0);

  const copy = () => {
    navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-10 text-center">
        <div className="text-5xl">🎉</div>
        <h2 className="mt-3 text-3xl font-bold">Your storefront is live!</h2>
        <p className="mt-2 text-muted-foreground">{r.name} is now taking direct orders.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Your storefront URL</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 truncate rounded-lg bg-muted px-3 py-2 text-sm">{url}</code>
          <button onClick={copy} className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
          <a href={`/r/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-muted">
            <ExternalLink className="h-3.5 w-3.5" /> Visit
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[200px,1fr]">
        <div className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center">
          <div className="h-32 w-32 rounded-lg bg-[conic-gradient(at_top_left,_black_25%,_transparent_25%,_transparent_50%,_black_50%,_black_75%,_transparent_75%)] bg-[length:16px_16px] border border-border" />
          <p className="mt-2 text-xs text-muted-foreground">QR placeholder</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Onboarding success</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Direct ordering ready</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Stripe {stripeStatus === "connected" ? "connected" : "pending"}</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Menu live ({itemCount} items)</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <Share2 className="h-3.5 w-3.5" /> Share to Instagram
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
              <Share2 className="h-3.5 w-3.5" /> Share to Facebook
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={onGoToDashboard}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90"
      >
        Go to dashboard
      </button>
    </div>
  );
}

/* ---------------- Shared form atoms ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Grid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>{children}</div>;
}

function Text({
  label, value, onChange, type = "text", placeholder, className = "",
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function NumberField({
  label, value, onChange, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Textarea({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Color({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono">{value}</p>
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-14 rounded-md border border-border bg-transparent cursor-pointer"
      />
    </div>
  );
}

function Pills<T extends string>({
  label, value, onChange, options,
}: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
              value === o.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full ${checked ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function ImageDrop({
  label, preview, onPick, onClear, aspect,
}: { label: string; preview?: string; onPick: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void; aspect: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <label className={`relative block w-full ${aspect} rounded-2xl border-2 border-dashed border-border bg-muted overflow-hidden cursor-pointer hover:border-primary/40 transition-colors`}>
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
            <ImagePlus className="h-5 w-5" />
            Click or drop to upload
          </span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={onPick} />
      </label>
      {preview && (
        <button onClick={onClear} className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      )}
    </div>
  );
}