import type {
  Restaurant,
  RestaurantThemeConfig,
  RestaurantBranding,
  FulfilmentSettings,
} from "@/types";

export const defaultFulfilment: FulfilmentSettings = {
  pickup: { enabled: true, prepTimeMinutes: 20 },
  delivery: {
    enabled: true,
    radiusMiles: 3,
    fee: 2.5,
    minimumOrder: 12,
    etaMinutes: 35,
  },
};

export const defaultTheme: RestaurantThemeConfig = {
  themeName: "classic",
  primaryColor: "#c2410c",
  accentColor: "#f59e0b",
  backgroundColor: "#fffaf3",
  buttonColor: "#c2410c",
  textColor: "#1f1410",
  heroLayout: "image",
  menuLayout: "list",
  categoryNavigation: "tabs",
  cartStyle: "drawer",
  showFeaturedItems: true,
  showOpeningHours: true,
  showBadges: true,
  showReviews: false,
  ctaText: "Order Now",
  enabledPages: ["home", "menu", "contact"],
  showMap: true,
  showPhone: true,
  showEmail: true,
  showSocialLinks: true,
  showDeliveryAreas: true,
};

const nfBranding: RestaurantBranding = {
  logoUrl: undefined,
  heroImageUrl:
    "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1600&q=80",
  tagline: "Handmade fried chicken & loaded fries — Northampton",
  description:
    "Family-run kitchen serving buttermilk-brined fried chicken, loaded fries, and inventive sides. Cooked to order, served fast, made for sharing.",
  email: "hello@naturalfingers.co.uk",
  socials: { instagram: "@naturalfingers", facebook: "naturalfingersuk" },
  deliveryAreas: ["NN1", "NN2", "NN3", "NN4", "NN5"],
};

export const naturalFingers: Restaurant = {
  id: "rest_nf_01",
  slug: "naturalfingers",
  name: "Natural Fingers",
  tagline: "Handmade fried chicken & loaded fries — Northampton",
  city: "Northampton",
  address: "12 Market Square, Northampton",
  postcode: "NN1 2DP",
  phone: "+44 1604 123456",
  heroImage:
    "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1600&q=80",
  brandColor: "#c2410c",
  openNow: true,
  hours: "Mon–Sun · 11:30 – 22:00",
  pickupEnabled: true,
  deliveryEnabled: true,
  onboardingComplete: true,
  stripeConnected: true,
  subscriptionStatus: "active",
  theme: { ...defaultTheme },
  branding: nfBranding,
  fulfilment: { ...defaultFulfilment },
  menu: [
    {
      id: "cat_signatures",
      name: "Signatures",
      items: [
        {
          id: "item_classic_tenders",
          name: "Classic Chicken Tenders",
          description: "Buttermilk-brined tenders, crispy golden coating.",
          price: 8.5,
          category: "cat_signatures",
          available: true,
          image:
            "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80",
          modifiers: [
            {
              id: "mod_size",
              name: "Portion",
              required: true,
              multi: false,
              options: [
                { id: "s", name: "3 tenders", price: 0 },
                { id: "m", name: "5 tenders", price: 2.5 },
                { id: "l", name: "8 tenders", price: 5 },
              ],
            },
            {
              id: "mod_sauce",
              name: "Dipping Sauce",
              required: false,
              multi: true,
              options: [
                { id: "bbq", name: "Smoky BBQ", price: 0.5 },
                { id: "ranch", name: "Buttermilk Ranch", price: 0.5 },
                { id: "hot", name: "Hot Honey", price: 0.75 },
              ],
            },
          ],
        },
        {
          id: "item_nashville",
          name: "Nashville Hot Burger",
          description: "Spicy fried chicken thigh, slaw, pickles, brioche.",
          price: 11,
          category: "cat_signatures",
          available: true,
          image:
            "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "item_korean_wings",
          name: "Korean Glazed Wings",
          description: "Double-fried wings, gochujang glaze, sesame.",
          price: 9.5,
          category: "cat_signatures",
          available: true,
          image:
            "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
        },
      ],
    },
    {
      id: "cat_sides",
      name: "Loaded Sides",
      items: [
        {
          id: "item_dirty_fries",
          name: "Dirty Fries",
          description: "Skin-on fries, cheese sauce, crispy onions, chives.",
          price: 6,
          category: "cat_sides",
          available: true,
          image:
            "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "item_slaw",
          name: "House Slaw",
          description: "Cabbage, carrot, apple, buttermilk dressing.",
          price: 3.5,
          category: "cat_sides",
          available: true,
        },
        {
          id: "item_mac",
          name: "Mac & Cheese",
          description: "Three-cheese sauce, crunchy crumb topping.",
          price: 5.5,
          category: "cat_sides",
          available: false,
        },
      ],
    },
    {
      id: "cat_drinks",
      name: "Drinks",
      items: [
        {
          id: "item_lemonade",
          name: "Cloudy Lemonade",
          description: "House-pressed, lightly sparkling.",
          price: 3,
          category: "cat_drinks",
          available: true,
        },
        {
          id: "item_cola",
          name: "Mexican Cola",
          description: "Glass bottle, cane sugar.",
          price: 3.25,
          category: "cat_drinks",
          available: true,
        },
      ],
    },
  ],
};

export const allRestaurants: Restaurant[] = [
  naturalFingers,
  {
    ...naturalFingers,
    id: "rest_bm_01",
    slug: "bricksandmortar",
    name: "Brick & Mortar Pizza",
    tagline: "Wood-fired sourdough pizza — Leicester",
    city: "Leicester",
    onboardingComplete: false,
    stripeConnected: false,
    subscriptionStatus: "trialing",
    openNow: false,
  },
  {
    ...naturalFingers,
    id: "rest_th_01",
    slug: "thaihouse",
    name: "Thai House",
    tagline: "Bangkok street food — Birmingham",
    city: "Birmingham",
    onboardingComplete: true,
    stripeConnected: false,
    subscriptionStatus: "past_due",
  },
];

export function getRestaurantBySlug(slug: string): Restaurant | undefined {
  return allRestaurants.find((r) => r.slug === slug);
}

export function getRestaurantById(id: string): Restaurant | undefined {
  return allRestaurants.find((r) => r.id === id);
}