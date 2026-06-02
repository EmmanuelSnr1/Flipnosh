import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  saveFullBranding,
  saveFullTheme,
  saveRestaurantSettings,
  dashboardSearch,
  type DashboardContext,
} from "@/api/dashboard";
import { Route as DashboardRoute } from "./dashboard";
import { getRestaurantPublicUrl } from "@/lib/tenant/get-public-url";
import type {
  CartStyle,
  CategoryNav,
  HeroLayout,
  MenuLayout,
  StorefrontPageId,
  ThemeName,
} from "@/types";
import { toast } from "sonner";
import { ExternalLink, Lock, Check, Copy, Globe } from "lucide-react";
import { ImageUpload } from "@/components/shared/ImageUpload";

export const Route = createFileRoute("/dashboard/storefront")({
  validateSearch: dashboardSearch,
  component: StorefrontConfigPage,
});

const PAGES: {
  id: StorefrontPageId;
  name: string;
  description: string;
  locked?: boolean;
}[] = [
  { id: "home", name: "Home", description: "Hero, intro, featured items, CTA." },
  {
    id: "menu",
    name: "Menu / Order",
    description: "Categories, items, cart, checkout.",
  },
  {
    id: "contact",
    name: "Contact / Info",
    description: "Address, hours, map, social links.",
  },
  {
    id: "about",
    name: "About",
    description: "Your story, team, kitchen.",
    locked: true,
  },
  {
    id: "offers",
    name: "Offers / Loyalty",
    description: "Promotions and loyalty rewards.",
    locked: true,
  },
];

const THEMES: { id: ThemeName; name: string; tagline: string }[] = [
  {
    id: "classic",
    name: "Classic",
    tagline: "Strong hero, traditional menu. Kebab, pizza, Indian, Chinese.",
  },
  {
    id: "modern",
    name: "Modern",
    tagline: "Sleek cards, spacious. Sushi, burgers, desserts, cafés.",
  },
  {
    id: "bold",
    name: "Bold",
    tagline: "Big type, high-impact CTAs. Street food, grill, wings.",
  },
];

// ── Layout option arrays (with tiny wireframe previews) ───────────────────────

const HERO_LAYOUT_OPTIONS: Array<{ value: HeroLayout; label: string; preview: React.ReactNode }> = [
  {
    value: "image",
    label: "Image bg",
    preview: (
      <div className="relative h-full w-full bg-zinc-300 rounded overflow-hidden">
        <div className="absolute inset-0 bg-zinc-800/60" />
        <div className="absolute bottom-1.5 left-1.5 space-y-0.5">
          <div className="h-1.5 w-10 bg-white/80 rounded" />
          <div className="h-1 w-6 bg-white/50 rounded" />
          <div className="mt-0.5 h-2 w-5 bg-primary/80 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    value: "split",
    label: "Split",
    preview: (
      <div className="flex h-full gap-0.5 rounded overflow-hidden">
        <div className="flex-1 bg-zinc-300" />
        <div className="flex-1 bg-white flex flex-col justify-center gap-0.5 px-1.5">
          <div className="h-1.5 w-full bg-zinc-300 rounded" />
          <div className="h-1 w-3/4 bg-zinc-200 rounded" />
          <div className="mt-1 h-2 w-5 bg-primary/70 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    value: "minimal",
    label: "Minimal",
    preview: (
      <div className="h-full w-full bg-white flex flex-col items-center justify-center gap-0.5">
        <div className="h-2 w-12 bg-zinc-300 rounded" />
        <div className="h-1 w-8 bg-zinc-200 rounded" />
        <div className="mt-1 h-2 w-7 bg-primary/70 rounded-full" />
      </div>
    ),
  },
];

const MENU_LAYOUT_OPTIONS: Array<{ value: MenuLayout; label: string; preview: React.ReactNode }> = [
  {
    value: "list",
    label: "List",
    preview: (
      <div className="h-full w-full bg-white flex flex-col gap-0.5 p-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className="h-full aspect-square bg-zinc-300 rounded shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="h-1 w-full bg-zinc-300 rounded" />
              <div className="h-0.5 w-2/3 bg-zinc-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    value: "grid",
    label: "Grid",
    preview: (
      <div className="h-full w-full bg-white grid grid-cols-2 gap-0.5 p-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-300 rounded" />
        ))}
      </div>
    ),
  },
  {
    value: "card",
    label: "Cards",
    preview: (
      <div className="h-full w-full bg-zinc-100 flex gap-1 p-1">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 bg-white rounded border border-zinc-200 flex flex-col overflow-hidden">
            <div className="flex-1 bg-zinc-300" />
            <div className="p-0.5 space-y-0.5">
              <div className="h-0.5 w-full bg-zinc-300 rounded" />
              <div className="h-0.5 w-2/3 bg-zinc-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

const CATEGORY_NAV_OPTIONS: Array<{ value: CategoryNav; label: string; preview: React.ReactNode }> = [
  {
    value: "tabs",
    label: "Sticky tabs",
    preview: (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex gap-0.5 px-1 py-0.5 border-b border-zinc-200">
          <div className="h-3 flex-1 bg-zinc-200 rounded-sm" />
          <div className="h-3 flex-1 bg-primary/50 rounded-sm" />
          <div className="h-3 flex-1 bg-zinc-200 rounded-sm" />
        </div>
        <div className="flex-1 p-1 grid grid-cols-2 gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-200 rounded" />
          ))}
        </div>
      </div>
    ),
  },
  {
    value: "sidebar",
    label: "Sidebar",
    preview: (
      <div className="h-full w-full bg-white flex gap-0.5">
        <div className="w-1/3 border-r border-zinc-200 p-0.5 flex flex-col gap-0.5">
          <div className="h-1.5 w-full bg-primary/50 rounded-sm" />
          <div className="h-1.5 w-full bg-zinc-200 rounded-sm" />
          <div className="h-1.5 w-full bg-zinc-200 rounded-sm" />
          <div className="h-1.5 w-full bg-zinc-200 rounded-sm" />
        </div>
        <div className="flex-1 p-0.5 grid grid-cols-2 gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-200 rounded" />
          ))}
        </div>
      </div>
    ),
  },
  {
    value: "dropdown",
    label: "Dropdown",
    preview: (
      <div className="h-full w-full bg-white flex flex-col p-1 gap-1">
        <div className="flex items-center justify-between h-4 bg-zinc-200 rounded px-1">
          <div className="h-1 w-8 bg-zinc-400 rounded" />
          <div className="h-1 w-1 border-r border-b border-zinc-500 rotate-45 mr-0.5" />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-200 rounded" />
          ))}
        </div>
      </div>
    ),
  },
];

const CART_STYLE_OPTIONS: Array<{ value: CartStyle; label: string; preview: React.ReactNode }> = [
  {
    value: "drawer",
    label: "Drawer",
    preview: (
      <div className="h-full w-full bg-zinc-100 flex gap-0.5">
        <div className="flex-1 bg-white p-0.5 flex flex-col gap-0.5">
          <div className="h-1 w-full bg-zinc-200 rounded" />
          <div className="h-1 w-2/3 bg-zinc-200 rounded" />
        </div>
        <div className="w-1/3 bg-white border-l border-zinc-200 p-0.5 flex flex-col gap-0.5">
          <div className="h-1 w-full bg-zinc-300 rounded" />
          <div className="h-0.5 w-full bg-zinc-200 rounded" />
          <div className="mt-auto h-2 w-full bg-primary/60 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    value: "sidebar",
    label: "Sidebar",
    preview: (
      <div className="h-full w-full bg-zinc-100 flex gap-0.5">
        <div className="flex-1 p-0.5 grid grid-cols-2 gap-0.5 content-start">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-white rounded border border-zinc-200" />
          ))}
        </div>
        <div className="w-1/3 bg-white border-l border-zinc-200 p-0.5 flex flex-col gap-0.5">
          <div className="h-1 w-full bg-zinc-300 rounded" />
          <div className="h-0.5 w-3/4 bg-zinc-200 rounded" />
          <div className="mt-auto h-2 w-full bg-primary/60 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    value: "bottom-bar",
    label: "Bottom bar",
    preview: (
      <div className="h-full w-full bg-white flex flex-col">
        <div className="flex-1 p-0.5 grid grid-cols-2 gap-0.5 content-start">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-zinc-200 rounded" />
          ))}
        </div>
        <div className="h-4 bg-primary/60 flex items-center justify-between px-1 gap-1">
          <div className="h-1 flex-1 bg-white/70 rounded" />
          <div className="h-3 w-7 bg-white/90 rounded-sm shrink-0" />
        </div>
      </div>
    ),
  },
];

// ── Storefront URL card ───────────────────────────────────────────────────────

function StorefrontUrlCard({ restaurant }: { restaurant: DashboardContext["restaurant"] }) {
  const publicUrl = getRestaurantPublicUrl({
    subdomain: restaurant.subdomain,
    slug: restaurant.slug,
  });

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl).catch(() => {});
    toast.success("URL copied to clipboard");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold">Your storefront URL</p>
        {restaurant.subdomain && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            Live on subdomain
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-xl bg-muted px-3 py-2 text-sm font-mono">
          {publicUrl}
        </code>
        <button
          onClick={copyUrl}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open
        </a>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function StorefrontConfigPage() {
  const { restaurant, branding, theme } = DashboardRoute.useLoaderData() as DashboardContext;
  const { r } = Route.useSearch();
  const restaurantId = r!;

  // ── Theme state (from DB) ──────────────────────────────────────────────────
  const [themeName, setThemeName] = useState<ThemeName>(
    (theme?.theme_name as ThemeName) ?? "classic",
  );
  const [primaryColor, setPrimaryColor] = useState(
    theme?.primary_color ?? "#f97316",
  );
  const [accentColor, setAccentColor] = useState(
    theme?.accent_color ?? "#f97316",
  );
  const [backgroundColor, setBackgroundColor] = useState(
    theme?.background_color ?? "#ffffff",
  );
  const [buttonColor, setButtonColor] = useState(
    theme?.button_color ?? "#f97316",
  );
  const [textColor, setTextColor] = useState(theme?.text_color ?? "#18181b");
  const [heroLayout, setHeroLayout] = useState<HeroLayout>(
    (theme?.hero_layout as HeroLayout) ?? "image",
  );
  const [menuLayout, setMenuLayout] = useState<MenuLayout>(
    (theme?.menu_layout as MenuLayout) ?? "list",
  );
  const [categoryNavigation, setCategoryNavigation] = useState<CategoryNav>(
    (theme?.category_navigation as CategoryNav) ?? "tabs",
  );
  const [cartStyle, setCartStyle] = useState<CartStyle>(
    (theme?.cart_style as CartStyle) ?? "drawer",
  );
  const [showFeaturedItems, setShowFeaturedItems] = useState(
    theme?.show_featured_items ?? true,
  );
  const [showOpeningHours, setShowOpeningHours] = useState(
    theme?.show_opening_hours ?? true,
  );
  const [showBadges, setShowBadges] = useState(theme?.show_badges ?? true);
  const [showReviews, setShowReviews] = useState(theme?.show_reviews ?? false);
  const [enabledPages, setEnabledPages] = useState<string[]>(
    theme?.enabled_pages ?? ["home", "menu", "contact"],
  );
  const [ctaText, setCtaText] = useState(theme?.cta_text ?? "Order Now");

  // ── Branding state (from DB) ───────────────────────────────────────────────
  const [restaurantName, setRestaurantName] = useState(restaurant.name);
  const [tagline, setTagline] = useState(branding?.tagline ?? "");
  const [description, setDescription] = useState(branding?.description ?? "");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(
    branding?.logo_url ?? undefined,
  );
  const [heroImageUrl, setHeroImageUrl] = useState<string | undefined>(
    branding?.hero_image_url ?? undefined,
  );

  // ── Contact page toggles — local-only until DB schema is extended ──────────
  const [showMap, setShowMap] = useState(true);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [showSocialLinks, setShowSocialLinks] = useState(true);
  const [showDeliveryAreas, setShowDeliveryAreas] = useState(false);

  // ── Saving text section ────────────────────────────────────────────────────
  const [savingText, setSavingText] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Fire-and-forget partial theme save (for discrete selections & toggles). */
  const saveTheme = async (partial: Record<string, unknown>) => {
    try {
      await saveFullTheme({ data: { restaurantId, ...partial } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const selectTheme = (id: ThemeName) => {
    setThemeName(id);
    saveTheme({ themeName: id });
  };

  const saveColorOnBlur =
    (field: string) => (e: React.FocusEvent<HTMLInputElement>) => {
      saveTheme({ [field]: e.target.value });
    };

  // Typed setter + auto-save for layout selectors
  const makeLayoutHandler = <T extends string>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    field: string,
  ) =>
    (v: T) => {
      setter(v);
      saveTheme({ [field]: v });
    };

  const toggleBool = (
    setter: (v: boolean) => void,
    field: string,
    current: boolean,
  ) => {
    const next = !current;
    setter(next);
    saveTheme({ [field]: next });
  };

  const togglePage = (id: StorefrontPageId, locked: boolean) => {
    if (locked) {
      toast.error("Upgrade to Pro to unlock this page");
      return;
    }
    const next = enabledPages.includes(id)
      ? enabledPages.filter((p) => p !== id)
      : [...enabledPages, id];
    setEnabledPages(next);
    saveTheme({ enabledPages: next });
  };

  const saveBrandText = async () => {
    if (savingText) return;
    setSavingText(true);
    try {
      await Promise.all([
        saveRestaurantSettings({ data: { restaurantId, name: restaurantName } }),
        saveFullBranding({ data: { restaurantId, tagline, description } }),
        saveFullTheme({ data: { restaurantId, ctaText } }),
      ]);
      toast.success("Storefront updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save changes",
      );
    } finally {
      setSavingText(false);
    }
  };

  /** Save a single image URL to restaurant_branding immediately after upload. */
  const persistImage = async (field: "logoUrl" | "heroImageUrl", url: string | null) => {
    try {
      await saveFullBranding({ data: { restaurantId, [field]: url } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save image");
    }
  };

  return (
    <>
      <PageHeader
        title="Storefront"
        subtitle="Customize the look and content of your direct-order site."
      />

      <div className="p-6 max-w-5xl space-y-6">
        {/* ── STOREFRONT URL ── */}
        <StorefrontUrlCard restaurant={restaurant} />
        {/* ── THEME ── */}
        <Card title="Theme">
          <div className="grid gap-3 sm:grid-cols-3 p-5">
            {THEMES.map((t) => {
              const active = themeName === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTheme(t.id)}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    active
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{t.name}</p>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.tagline}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── BRANDING ── */}
        <Card title="Branding">
          <div className="p-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUpload
                label="Logo"
                currentUrl={logoUrl}
                bucket="restaurant-assets"
                path={`${restaurantId}/logo`}
                aspect="aspect-square"
                onUploaded={(url) => {
                  setLogoUrl(url);
                  void persistImage("logoUrl", url);
                }}
                onCleared={() => {
                  setLogoUrl(undefined);
                  void persistImage("logoUrl", null);
                }}
              />
              <ImageUpload
                label="Cover / hero image"
                currentUrl={heroImageUrl}
                bucket="restaurant-assets"
                path={`${restaurantId}/hero`}
                aspect="aspect-[16/9]"
                onUploaded={(url) => {
                  setHeroImageUrl(url);
                  void persistImage("heroImageUrl", url);
                }}
                onCleared={() => {
                  setHeroImageUrl(undefined);
                  void persistImage("heroImageUrl", null);
                }}
              />
            </div>

            <TextRow
              label="Brand name"
              value={restaurantName}
              onChange={setRestaurantName}
            />
            <TextRow label="Tagline" value={tagline} onChange={setTagline} />
            <TextAreaRow
              label="Description"
              value={description}
              onChange={setDescription}
            />
            <TextRow
              label="CTA button text"
              value={ctaText}
              onChange={setCtaText}
              placeholder="Order Now"
            />

            <button
              onClick={saveBrandText}
              disabled={savingText}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {savingText ? "Saving…" : "Save text changes"}
            </button>
          </div>
        </Card>

        {/* ── COLOURS ── */}
        <Card title="Colours">
          <div className="p-5 grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Primary"
              value={primaryColor}
              onChange={setPrimaryColor}
              onBlur={saveColorOnBlur("primaryColor")}
            />
            <ColorField
              label="Accent"
              value={accentColor}
              onChange={setAccentColor}
              onBlur={saveColorOnBlur("accentColor")}
            />
            <ColorField
              label="Background"
              value={backgroundColor}
              onChange={setBackgroundColor}
              onBlur={saveColorOnBlur("backgroundColor")}
            />
            <ColorField
              label="Button"
              value={buttonColor}
              onChange={setButtonColor}
              onBlur={saveColorOnBlur("buttonColor")}
            />
            <ColorField
              label="Text"
              value={textColor}
              onChange={setTextColor}
              onBlur={saveColorOnBlur("textColor")}
            />
          </div>
        </Card>

        {/* ── LAYOUT ── */}
        <Card title="Layout">
          <div className="p-5 space-y-5">
            <VisualSelectRow<HeroLayout>
              label="Hero layout"
              value={heroLayout}
              onChange={makeLayoutHandler(setHeroLayout, "heroLayout")}
              options={HERO_LAYOUT_OPTIONS}
            />
            <VisualSelectRow<MenuLayout>
              label="Menu layout"
              value={menuLayout}
              onChange={makeLayoutHandler(setMenuLayout, "menuLayout")}
              options={MENU_LAYOUT_OPTIONS}
            />
            <VisualSelectRow<CategoryNav>
              label="Category navigation"
              value={categoryNavigation}
              onChange={makeLayoutHandler(setCategoryNavigation, "categoryNavigation")}
              options={CATEGORY_NAV_OPTIONS}
            />
            <VisualSelectRow<CartStyle>
              label="Cart style"
              value={cartStyle}
              onChange={makeLayoutHandler(setCartStyle, "cartStyle")}
              options={CART_STYLE_OPTIONS}
            />
          </div>
        </Card>

        {/* ── HOMEPAGE TOGGLES ── */}
        <Card title="Homepage sections">
          <div className="p-5 divide-y divide-border">
            <ToggleRow
              label="Featured items"
              checked={showFeaturedItems}
              onChange={() =>
                toggleBool(
                  setShowFeaturedItems,
                  "showFeaturedItems",
                  showFeaturedItems,
                )
              }
            />
            <ToggleRow
              label="Opening hours"
              checked={showOpeningHours}
              onChange={() =>
                toggleBool(
                  setShowOpeningHours,
                  "showOpeningHours",
                  showOpeningHours,
                )
              }
            />
            <ToggleRow
              label="Pickup / delivery badges"
              checked={showBadges}
              onChange={() =>
                toggleBool(setShowBadges, "showBadges", showBadges)
              }
            />
            <ToggleRow
              label="Customer reviews (placeholder)"
              checked={showReviews}
              onChange={() =>
                toggleBool(setShowReviews, "showReviews", showReviews)
              }
            />
          </div>
        </Card>

        {/* ── CONTACT TOGGLES (local-only; DB columns added in Phase 2) ── */}
        <Card title="Contact page">
          <div className="p-5 divide-y divide-border">
            <ToggleRow
              label="Map placeholder"
              checked={showMap}
              onChange={() => setShowMap(!showMap)}
            />
            <ToggleRow
              label="Phone"
              checked={showPhone}
              onChange={() => setShowPhone(!showPhone)}
            />
            <ToggleRow
              label="Email"
              checked={showEmail}
              onChange={() => setShowEmail(!showEmail)}
            />
            <ToggleRow
              label="Social links"
              checked={showSocialLinks}
              onChange={() => setShowSocialLinks(!showSocialLinks)}
            />
            <ToggleRow
              label="Delivery areas"
              checked={showDeliveryAreas}
              onChange={() => setShowDeliveryAreas(!showDeliveryAreas)}
            />
          </div>
        </Card>

        {/* ── PAGES ── */}
        <Card title="Storefront pages">
          <div className="p-5 space-y-3">
            {PAGES.map((p) => {
              const enabled = enabledPages.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${
                    p.locked
                      ? "bg-muted/40 border-dashed"
                      : "border-border bg-card"
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
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                    {p.locked && (
                      <button
                        onClick={() =>
                          toast.error("Upgrade to Pro to unlock this page")
                        }
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

// ── Sub-components ───────────────────────────────────────────────────────────

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
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
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
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
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
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
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
        onBlur={onBlur}
        className="h-10 w-14 rounded-md border border-border bg-transparent cursor-pointer"
      />
    </div>
  );
}

function VisualSelectRow<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; preview: React.ReactNode }[];
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`rounded-xl border-2 overflow-hidden text-left transition-all ${
                active
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {/* Wireframe preview */}
              <div className="h-16 bg-muted overflow-hidden p-1.5">
                {o.preview}
              </div>
              {/* Label row */}
              <div
                className={`flex items-center justify-between px-2 py-1.5 ${
                  active ? "bg-primary/5" : "bg-background"
                }`}
              >
                <span className="text-xs font-medium truncate">{o.label}</span>
                {active && (
                  <Check className="h-3 w-3 text-primary shrink-0 ml-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <span className="text-sm">{label}</span>
      <button
        onClick={onChange}
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

