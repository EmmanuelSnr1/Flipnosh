/**
 * Adapts the Supabase storefront query result into the existing Restaurant
 * view-model used by all storefront UI components.
 *
 * This keeps the database schema (snake_case, pence, flat fulfilment) fully
 * decoupled from the UI layer while we migrate away from mock data.
 */
import type {
  Restaurant,
  MenuCategory,
  MenuItem,
  ModifierGroup,
  RestaurantThemeConfig,
  RestaurantBranding,
  FulfilmentSettings,
  ThemeName,
  HeroLayout,
  MenuLayout,
  CategoryNav,
  CartStyle,
  StorefrontPageId,
} from "@/types";
import { defaultTheme, defaultFulfilment } from "@/data/restaurants";

// ─── Input types (mirrors the nested Supabase query shape) ───────────────────

type SbModifier = {
  id: string;
  name: string;
  price_delta_pence: number;
  is_available: boolean;
};

type SbModifierGroup = {
  id: string;
  name: string;
  min_select: number;
  max_select: number;
  required: boolean;
  modifiers: SbModifier[];
};

type SbMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_pence: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  dietary_labels: string[] | null;
  allergens: string[] | null;
  calories_kcal: number | null;
  spice_level: number;
  modifier_groups: SbModifierGroup[];
};

type SbCategory = {
  id: string;
  name: string;
  sort_order: number;
  menu_items: SbMenuItem[];
};

type SbMenu = {
  id: string;
  name: string;
  is_active: boolean;
  menu_categories: SbCategory[];
};

type SbBranding = {
  logo_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  description: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
} | null;

type SbTheme = {
  theme_name: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  button_color: string;
  text_color: string;
  hero_layout: string;
  menu_layout: string;
  category_navigation: string;
  cart_style: string;
  show_featured_items: boolean;
  show_opening_hours: boolean;
  show_badges: boolean;
  show_reviews: boolean;
  cta_text: string;
  enabled_pages: unknown;
} | null;

type SbFulfilment = {
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  pickup_prep_time_minutes: number;
  delivery_time_minutes: number;
  delivery_radius_miles: number;
  delivery_fee_pence: number;
  minimum_delivery_order_pence: number;
} | null;

export type SupabaseStorefront = {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  status: string;
  city: string | null;
  address: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_account_id: string | null;
  onboarding_completed: boolean;
  branding: SbBranding;
  theme: SbTheme;
  fulfilment: SbFulfilment;
  menus: SbMenu[];
};

// ─── Normalise enum-like string values ───────────────────────────────────────

function normaliseHeroLayout(raw: string): HeroLayout {
  if (raw === "split") return "split";
  if (raw === "minimal") return "minimal";
  return "image"; // "image-background" and anything else → "image"
}

function normaliseMenuLayout(raw: string): MenuLayout {
  if (raw === "grid") return "grid";
  if (raw === "card" || raw === "cards") return "card";
  return "list";
}

function normaliseCategoryNav(raw: string): CategoryNav {
  if (raw === "sidebar") return "sidebar";
  if (raw === "dropdown") return "dropdown";
  return "tabs"; // "sticky-tabs" and anything else → "tabs"
}

function normaliseCartStyle(raw: string): CartStyle {
  if (raw === "sidebar") return "sidebar";
  if (raw === "bottom-bar") return "bottom-bar";
  return "drawer";
}

// ─── Sub-adapters ─────────────────────────────────────────────────────────────

function adaptTheme(sb: SbTheme): RestaurantThemeConfig {
  if (!sb) return defaultTheme;
  const pages = Array.isArray(sb.enabled_pages)
    ? (sb.enabled_pages as StorefrontPageId[])
    : (["home", "menu", "contact"] as StorefrontPageId[]);

  return {
    themeName: (sb.theme_name as ThemeName) ?? defaultTheme.themeName,
    primaryColor: sb.primary_color,
    accentColor: sb.accent_color,
    backgroundColor: sb.background_color,
    buttonColor: sb.button_color,
    textColor: sb.text_color,
    heroLayout: normaliseHeroLayout(sb.hero_layout),
    menuLayout: normaliseMenuLayout(sb.menu_layout),
    categoryNavigation: normaliseCategoryNav(sb.category_navigation),
    cartStyle: normaliseCartStyle(sb.cart_style),
    showFeaturedItems: sb.show_featured_items,
    showOpeningHours: sb.show_opening_hours,
    showBadges: sb.show_badges,
    showReviews: sb.show_reviews,
    ctaText: sb.cta_text,
    enabledPages: pages,
    // Contact-page toggles — not stored in DB yet; default all on
    showMap: true,
    showPhone: true,
    showEmail: true,
    showSocialLinks: true,
    showDeliveryAreas: false,
  };
}

function adaptBranding(sb: SbBranding, restaurantEmail: string | null): RestaurantBranding {
  return {
    logoUrl: sb?.logo_url ?? undefined,
    heroImageUrl: sb?.hero_image_url ?? undefined,
    tagline: sb?.tagline ?? "",
    description: sb?.description ?? "",
    email: restaurantEmail ?? undefined,
    socials: {
      instagram: sb?.instagram_url ?? undefined,
      facebook: sb?.facebook_url ?? undefined,
      tiktok: sb?.tiktok_url ?? undefined,
    },
    deliveryAreas: [],
  };
}

function adaptFulfilment(sb: SbFulfilment): FulfilmentSettings {
  if (!sb) return defaultFulfilment;
  return {
    pickup: {
      enabled: sb.pickup_enabled,
      prepTimeMinutes: sb.pickup_prep_time_minutes,
    },
    delivery: {
      enabled: sb.delivery_enabled,
      radiusMiles: Number(sb.delivery_radius_miles),
      fee: sb.delivery_fee_pence / 100,
      minimumOrder: sb.minimum_delivery_order_pence / 100,
      etaMinutes: sb.delivery_time_minutes,
    },
  };
}

function adaptModifierGroup(sb: SbModifierGroup): ModifierGroup {
  return {
    id: sb.id,
    name: sb.name,
    required: sb.required,
    multi: sb.max_select > 1,
    options: sb.modifiers.map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price_delta_pence / 100,
    })),
  };
}

function adaptMenuItem(sb: SbMenuItem, categoryName: string): MenuItem {
  return {
    id: sb.id,
    name: sb.name,
    description: sb.description ?? "",
    price: sb.price_pence / 100,
    image: sb.image_url ?? undefined,
    category: categoryName,
    available: sb.is_available,
    modifiers: (sb.modifier_groups ?? []).map(adaptModifierGroup),
    isFeatured: sb.is_featured,
    dietaryLabels: sb.dietary_labels ?? [],
    allergens: sb.allergens ?? [],
    caloriesKcal: sb.calories_kcal,
    spiceLevel: sb.spice_level ?? 0,
  };
}

function adaptMenu(menus: SbMenu[]): MenuCategory[] {
  // Use the first active menu; fall back to first menu if none active
  const activeMenu =
    menus.find((m) => m.is_active) ?? menus[0];
  if (!activeMenu) return [];

  return (activeMenu.menu_categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    items: (cat.menu_items ?? []).map((item) => adaptMenuItem(item, cat.name)),
  }));
}

// ─── Main adapter ─────────────────────────────────────────────────────────────

export function adaptStorefrontToRestaurant(sb: SupabaseStorefront): Restaurant {
  const theme = adaptTheme(sb.theme);
  const branding = adaptBranding(sb.branding, sb.email);
  const fulfilment = adaptFulfilment(sb.fulfilment);
  const menu = adaptMenu(sb.menus);

  return {
    id: sb.id,
    slug: sb.slug,
    name: sb.name,
    tagline: sb.branding?.tagline ?? "",
    city: sb.city ?? "",
    address: sb.address ?? "",
    postcode: sb.postcode ?? "",
    phone: sb.phone ?? "",
    // heroImage: fallback to a placeholder if no Supabase image yet
    heroImage:
      sb.branding?.hero_image_url ??
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1600&q=80",
    logo: sb.branding?.logo_url ?? undefined,
    brandColor: sb.theme?.primary_color ?? theme.primaryColor,
    // openNow / hours are not yet in the DB — sensible defaults
    openNow: true,
    hours: "Mon–Sun: 11:00am – 10:00pm",
    pickupEnabled: sb.fulfilment?.pickup_enabled ?? true,
    deliveryEnabled: sb.fulfilment?.delivery_enabled ?? false,
    onboardingComplete: sb.onboarding_completed,
    stripeConnected: sb.stripe_onboarding_complete,
    canAcceptOnlinePayments: (sb.stripe_charges_enabled && sb.stripe_payouts_enabled) ?? false,
    subscriptionStatus: "trialing",
    menu,
    theme,
    branding,
    fulfilment,
  };
}
