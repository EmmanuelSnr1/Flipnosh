export type Modifier = {
  id: string;
  name: string;
  price: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  required: boolean;
  multi: boolean;
  options: Modifier[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  available: boolean;
  modifiers?: ModifierGroup[];
  // Rich metadata
  isFeatured?: boolean;
  dietaryLabels?: string[];
  allergens?: string[];
  caloriesKcal?: number | null;
  spiceLevel?: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type ThemeName = "classic" | "modern" | "bold";
export type HeroLayout = "image" | "split" | "minimal";
export type MenuLayout = "list" | "grid" | "card";
export type CategoryNav = "tabs" | "sidebar" | "dropdown";
export type CartStyle = "drawer" | "sidebar" | "bottom-bar";
export type StorefrontPageId = "home" | "menu" | "contact" | "about" | "offers";

export type RestaurantThemeConfig = {
  themeName: ThemeName;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  buttonColor: string;
  textColor: string;
  heroLayout: HeroLayout;
  menuLayout: MenuLayout;
  categoryNavigation: CategoryNav;
  cartStyle: CartStyle;
  showFeaturedItems: boolean;
  showOpeningHours: boolean;
  showBadges: boolean;
  showReviews: boolean;
  ctaText: string;
  enabledPages: StorefrontPageId[];
  // Contact page toggles
  showMap: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showSocialLinks: boolean;
  showDeliveryAreas: boolean;
};

export type RestaurantBranding = {
  logoUrl?: string;
  heroImageUrl?: string;
  tagline: string;
  description: string;
  email?: string;
  socials?: { instagram?: string; facebook?: string; tiktok?: string };
  deliveryAreas?: string[];
};

export type FulfilmentSettings = {
  pickup: {
    enabled: boolean;
    prepTimeMinutes: number;
  };
  delivery: {
    enabled: boolean;
    radiusMiles: number;
    fee: number;
    minimumOrder: number;
    etaMinutes: number;
  };
};

export type PaymentSetupState = StripeStatus;

export type OnboardingState = {
  currentStep: number;
  completedSteps: number[];
  launched: boolean;
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  city: string;
  address: string;
  postcode: string;
  phone: string;
  heroImage: string;
  logo?: string;
  brandColor: string;
  openNow: boolean;
  hours: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  onboardingComplete: boolean;
  stripeConnected: boolean;
  /** true when stripe_charges_enabled && stripe_payouts_enabled */
  canAcceptOnlinePayments: boolean;
  subscriptionStatus: "trialing" | "active" | "past_due" | "canceled";
  menu: MenuCategory[];
  theme: RestaurantThemeConfig;
  branding: RestaurantBranding;
  fulfilment: FulfilmentSettings;
};

export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: { groupName: string; optionName: string; price: number }[];
  notes?: string;
};

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "rejected";

export type StripeStatus = "not_started" | "onboarding" | "connected";

export type Order = {
  id: string;
  number: string;
  customer: string;
  email: string;
  phone: string;
  type: "pickup" | "delivery";
  status: OrderStatus;
  total: number;
  createdAt: string;
  notes?: string;
  items: { name: string; quantity: number; price: number }[];
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
};

export type QRCampaign = {
  id: string;
  name: string;
  location: string;
  scans: number;
  conversions: number;
  createdAt: string;
};