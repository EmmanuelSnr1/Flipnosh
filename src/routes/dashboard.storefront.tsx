import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { store, useStore } from "@/stores/mock-store";
import type {
  CartStyle,
  CategoryNav,
  HeroLayout,
  MenuLayout,
  StorefrontPageId,
  ThemeName,
} from "@/types";
import { toast } from "sonner";
import { ExternalLink, Lock, ImagePlus, Trash2, Check } from "lucide-react";

const SLUG = "naturalfingers";

export const Route = createFileRoute("/dashboard/storefront")({
  component: StorefrontConfigPage,
});

const PAGES: { id: StorefrontPageId; name: string; description: string; locked?: boolean }[] = [
  { id: "home", name: "Home", description: "Hero, intro, featured items, CTA." },
  { id: "menu", name: "Menu / Order", description: "Categories, items, cart, checkout." },
  { id: "contact", name: "Contact / Info", description: "Address, hours, map, social links." },
  { id: "about", name: "About", description: "Your story, team, kitchen.", locked: true },
  { id: "offers", name: "Offers / Loyalty", description: "Promotions and loyalty rewards.", locked: true },
];

const THEMES: { id: ThemeName; name: string; tagline: string }[] = [
  { id: "classic", name: "Classic", tagline: "Strong hero, traditional menu. Kebab, pizza, Indian, Chinese." },
  { id: "modern", name: "Modern", tagline: "Sleek cards, spacious. Sushi, burgers, desserts, cafés." },
  { id: "bold", name: "Bold", tagline: "Big type, high-impact CTAs. Street food, grill, wings." },
];

function StorefrontConfigPage() {
  const { restaurants } = useStore();
  const r = restaurants.find((x) => x.slug === SLUG)!;
  const theme = r.theme;
  const branding = r.branding;

  const [tagline, setTagline] = useState(branding.tagline);
  const [description, setDescription] = useState(branding.description);
  const [cta, setCta] = useState(theme.ctaText);

  useEffect(() => {
    setTagline(branding.tagline);
    setDescription(branding.description);
    setCta(theme.ctaText);
  }, [branding.tagline, branding.description, theme.ctaText]);

  const saveBrandText = () => {
    store.updateBranding(SLUG, { tagline, description });
    store.updateTheme(SLUG, { ctaText: cta });
    toast.success("Storefront updated");
  };

  const pickImage =
    (key: "logoUrl" | "heroImageUrl") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      store.updateBranding(SLUG, { [key]: url });
      toast.success("Image uploaded");
    };

  const clearImage = (key: "logoUrl" | "heroImageUrl") => {
    store.updateBranding(SLUG, { [key]: undefined });
  };

  const togglePage = (id: StorefrontPageId, locked: boolean) => {
    if (locked) {
      toast.error("Upgrade to Pro to unlock this page");
      return;
    }
    const enabled = theme.enabledPages.includes(id);
    const next = enabled
      ? theme.enabledPages.filter((p) => p !== id)
      : [...theme.enabledPages, id];
    store.updateTheme(SLUG, { enabledPages: next });
  };

  return (
    <>
      <PageHeader
        title="Storefront"
        subtitle="Customize the look and content of your direct-order site."
        action={
          <Link
            to="/r/$slug"
            params={{ slug: r.slug }}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View live storefront
          </Link>
        }
      />

      <div className="p-6 max-w-5xl space-y-6">
        {/* THEME */}
        <Card title="Theme">
          <div className="grid gap-3 sm:grid-cols-3 p-5">
            {THEMES.map((t) => {
              const active = theme.themeName === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => store.updateTheme(SLUG, { themeName: t.id })}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{t.name}</p>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.tagline}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* BRANDING */}
        <Card title="Branding">
          <div className="p-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageField
                label="Logo"
                preview={branding.logoUrl}
                onPick={pickImage("logoUrl")}
                onClear={() => clearImage("logoUrl")}
                aspect="aspect-square"
              />
              <ImageField
                label="Cover / hero image"
                preview={branding.heroImageUrl}
                onPick={pickImage("heroImageUrl")}
                onClear={() => clearImage("heroImageUrl")}
                aspect="aspect-[16/9]"
              />
            </div>

            <TextRow label="Brand name" value={r.name} onChange={(v) => store.updateRestaurant(SLUG, { name: v })} />
            <TextRow label="Tagline" value={tagline} onChange={setTagline} />
            <TextAreaRow label="Description" value={description} onChange={setDescription} />
            <TextRow label="CTA button text" value={cta} onChange={setCta} placeholder="Order Now" />

            <button
              onClick={saveBrandText}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Save text changes
            </button>
          </div>
        </Card>

        {/* COLORS */}
        <Card title="Colours">
          <div className="p-5 grid gap-4 sm:grid-cols-2">
            <ColorField label="Primary" value={theme.primaryColor} onChange={(v) => store.updateTheme(SLUG, { primaryColor: v })} />
            <ColorField label="Accent" value={theme.accentColor} onChange={(v) => store.updateTheme(SLUG, { accentColor: v })} />
            <ColorField label="Background" value={theme.backgroundColor} onChange={(v) => store.updateTheme(SLUG, { backgroundColor: v })} />
            <ColorField label="Button" value={theme.buttonColor} onChange={(v) => store.updateTheme(SLUG, { buttonColor: v })} />
            <ColorField label="Text" value={theme.textColor} onChange={(v) => store.updateTheme(SLUG, { textColor: v })} />
          </div>
        </Card>

        {/* LAYOUT */}
        <Card title="Layout">
          <div className="p-5 space-y-4">
            <SelectRow<HeroLayout>
              label="Hero layout"
              value={theme.heroLayout}
              onChange={(v) => store.updateTheme(SLUG, { heroLayout: v })}
              options={[
                { value: "image", label: "Image background" },
                { value: "split", label: "Split image / text" },
                { value: "minimal", label: "Minimal text-only" },
              ]}
            />
            <SelectRow<MenuLayout>
              label="Menu layout"
              value={theme.menuLayout}
              onChange={(v) => store.updateTheme(SLUG, { menuLayout: v })}
              options={[
                { value: "list", label: "List" },
                { value: "grid", label: "Grid" },
                { value: "card", label: "Card" },
              ]}
            />
            <SelectRow<CategoryNav>
              label="Category navigation"
              value={theme.categoryNavigation}
              onChange={(v) => store.updateTheme(SLUG, { categoryNavigation: v })}
              options={[
                { value: "tabs", label: "Sticky tabs" },
                { value: "sidebar", label: "Sidebar" },
                { value: "dropdown", label: "Dropdown" },
              ]}
            />
            <SelectRow<CartStyle>
              label="Cart style"
              value={theme.cartStyle}
              onChange={(v) => store.updateTheme(SLUG, { cartStyle: v })}
              options={[
                { value: "drawer", label: "Drawer" },
                { value: "sidebar", label: "Sidebar" },
                { value: "bottom-bar", label: "Mobile bottom bar" },
              ]}
            />
          </div>
        </Card>

        {/* HOMEPAGE TOGGLES */}
        <Card title="Homepage sections">
          <div className="p-5 divide-y divide-border">
            <ToggleRow label="Featured items" checked={theme.showFeaturedItems} onChange={(v) => store.updateTheme(SLUG, { showFeaturedItems: v })} />
            <ToggleRow label="Opening hours" checked={theme.showOpeningHours} onChange={(v) => store.updateTheme(SLUG, { showOpeningHours: v })} />
            <ToggleRow label="Pickup / delivery badges" checked={theme.showBadges} onChange={(v) => store.updateTheme(SLUG, { showBadges: v })} />
            <ToggleRow label="Customer reviews (placeholder)" checked={theme.showReviews} onChange={(v) => store.updateTheme(SLUG, { showReviews: v })} />
          </div>
        </Card>

        {/* CONTACT TOGGLES */}
        <Card title="Contact page">
          <div className="p-5 divide-y divide-border">
            <ToggleRow label="Map placeholder" checked={theme.showMap} onChange={(v) => store.updateTheme(SLUG, { showMap: v })} />
            <ToggleRow label="Phone" checked={theme.showPhone} onChange={(v) => store.updateTheme(SLUG, { showPhone: v })} />
            <ToggleRow label="Email" checked={theme.showEmail} onChange={(v) => store.updateTheme(SLUG, { showEmail: v })} />
            <ToggleRow label="Social links" checked={theme.showSocialLinks} onChange={(v) => store.updateTheme(SLUG, { showSocialLinks: v })} />
            <ToggleRow label="Delivery areas" checked={theme.showDeliveryAreas} onChange={(v) => store.updateTheme(SLUG, { showDeliveryAreas: v })} />
          </div>
        </Card>

        {/* PAGES */}
        <Card title="Storefront pages">
          <div className="p-5 space-y-3">
            {PAGES.map((p) => {
              const enabled = theme.enabledPages.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${
                    p.locked ? "bg-muted/40 border-dashed" : "border-border bg-card"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.name}</p>
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
                        className="mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        Upgrade to unlock →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => togglePage(p.id, !!p.locked)}
                    disabled={p.locked}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      enabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        enabled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="px-5 py-3 border-b border-border">
        <h2 className="font-semibold">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function TextRow({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function TextAreaRow({
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

function ColorField({
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

function SelectRow<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              value === o.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ImageField({
  label, preview, onPick, onClear, aspect,
}: {
  label: string;
  preview?: string;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  aspect: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <label className={`relative block w-full ${aspect} rounded-2xl border-2 border-dashed border-border bg-muted overflow-hidden cursor-pointer hover:border-primary/40 transition-colors`}>
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
            <ImagePlus className="h-5 w-5" />
            Click to upload
          </span>
        )}
        <input type="file" accept="image/*" className="sr-only" onChange={onPick} />
      </label>
      {preview && (
        <button
          onClick={onClear}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      )}
    </div>
  );
}