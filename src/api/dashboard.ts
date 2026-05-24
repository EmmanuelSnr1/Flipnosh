/**
 * Dashboard server functions
 *
 * All functions use the admin client with explicit restaurantId — the caller
 * is responsible for ensuring the user owns the restaurant (enforced by the
 * /dashboard parent route requiring a valid ?r= search param from login).
 *
 * Lazy Supabase imports keep this file safe for client-side route imports
 * (avoids the TanStack Start import-protection block on files in server/ directories).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Shared search validator ──────────────────────────────────────────────────
// All dashboard routes declare this so the `r` param flows through loaders.

export const dashboardSearch = (s: Record<string, unknown>) => ({
  r: typeof s.r === "string" ? s.r : (undefined as string | undefined),
});

// ─── Order status helpers (replaces mock-store constants) ─────────────────────

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
  completed: [],
  rejected: [],
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  rejected: "Rejected",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type DbRestaurant = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  address: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  onboarding_completed: boolean;
  cuisine_type: string | null;
  hours: string | null;
};

export type DbBranding = {
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
} | null;

export type DbTheme = {
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
  enabled_pages: string[];
} | null;

export type DbFulfilment = {
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  pickup_prep_time_minutes: number;
  delivery_time_minutes: number;
  delivery_radius_miles: number;
  delivery_fee_pence: number;
  minimum_delivery_order_pence: number;
} | null;

export type DashboardContext = {
  restaurant: DbRestaurant;
  branding: DbBranding;
  theme: DbTheme;
  fulfilment: DbFulfilment;
  subscription: {
    plan: string;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  } | null;
};

export type DashboardOrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit_price_pence: number;
  total_pence: number;
};

export type DashboardOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  fulfilment_type: string;
  status: string;
  payment_status: string;
  subtotal_pence: number;
  delivery_fee_pence: number;
  total_pence: number;
  notes: string | null;
  created_at: string;
  items: DashboardOrderItem[];
};

export type DashboardMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_pence: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  dietary_labels: string[];
  allergens: string[];
  calories_kcal: number | null;
  spice_level: number;
};

export type DashboardMenuCategory = {
  id: string;
  name: string;
  sort_order: number;
  items: DashboardMenuItem[];
};

export type DashboardMenuData = {
  menuId: string;
  categories: DashboardMenuCategory[];
};

export type DashboardCustomer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  total_orders: number;
  total_spend_pence: number;
  last_order_at: string | null;
};

// ─── getDashboardContext ──────────────────────────────────────────────────────

export const getDashboardContext = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardContext> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data, error } = await db
      .from("restaurants")
      .select(
        `
        id, name, slug, city, address, postcode, phone, email,
        status, onboarding_completed, cuisine_type, hours,
        restaurant_branding (*),
        restaurant_theme_configs (*),
        fulfilment_settings (*),
        platform_subscriptions (*)
      `,
      )
      .eq("id", restaurantId)
      .single();

    if (error) throw new Error(`Restaurant not found: ${restaurantId}`);

    const flatten = <T>(v: T[] | T | null): T | null => {
      if (Array.isArray(v)) return v[0] ?? null;
      return v ?? null;
    };

    const branding = flatten(data.restaurant_branding as never) as DbBranding;
    const rawTheme = flatten(data.restaurant_theme_configs as never) as Record<string, unknown> | null;
    const rawFul = flatten(data.fulfilment_settings as never) as Record<string, unknown> | null;
    const rawSub = flatten(data.platform_subscriptions as never) as Record<string, unknown> | null;

    const theme: DbTheme = rawTheme
      ? {
          theme_name: (rawTheme.theme_name as string) ?? "classic",
          primary_color: (rawTheme.primary_color as string) ?? "#f97316",
          accent_color: (rawTheme.accent_color as string) ?? "#f97316",
          background_color: (rawTheme.background_color as string) ?? "#ffffff",
          button_color: (rawTheme.button_color as string) ?? "#f97316",
          text_color: (rawTheme.text_color as string) ?? "#18181b",
          hero_layout: (rawTheme.hero_layout as string) ?? "image",
          menu_layout: (rawTheme.menu_layout as string) ?? "list",
          category_navigation: (rawTheme.category_navigation as string) ?? "tabs",
          cart_style: (rawTheme.cart_style as string) ?? "drawer",
          show_featured_items: (rawTheme.show_featured_items as boolean) ?? true,
          show_opening_hours: (rawTheme.show_opening_hours as boolean) ?? true,
          show_badges: (rawTheme.show_badges as boolean) ?? true,
          show_reviews: (rawTheme.show_reviews as boolean) ?? false,
          cta_text: (rawTheme.cta_text as string) ?? "Order Now",
          enabled_pages: (rawTheme.enabled_pages as string[]) ?? ["home", "menu", "contact"],
        }
      : null;

    const fulfilment: DbFulfilment = rawFul
      ? {
          pickup_enabled: (rawFul.pickup_enabled as boolean) ?? true,
          delivery_enabled: (rawFul.delivery_enabled as boolean) ?? false,
          pickup_prep_time_minutes: (rawFul.pickup_prep_time_minutes as number) ?? 20,
          delivery_time_minutes: (rawFul.delivery_time_minutes as number) ?? 45,
          delivery_radius_miles: (rawFul.delivery_radius_miles as number) ?? 3,
          delivery_fee_pence: (rawFul.delivery_fee_pence as number) ?? 250,
          minimum_delivery_order_pence: (rawFul.minimum_delivery_order_pence as number) ?? 1500,
        }
      : null;

    return {
      restaurant: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        city: data.city,
        address: data.address,
        postcode: data.postcode,
        phone: data.phone,
        email: data.email,
        status: data.status,
        onboarding_completed: data.onboarding_completed,
        cuisine_type: data.cuisine_type,
        hours: data.hours as string | null,
      },
      branding,
      theme,
      fulfilment,
      subscription: rawSub
        ? {
            plan: rawSub.plan as string,
            status: rawSub.status as string,
            trial_ends_at: (rawSub.trial_ends_at as string | null) ?? null,
            current_period_end: (rawSub.current_period_end as string | null) ?? null,
          }
        : null,
    };
  });

// ─── getDashboardOrders ───────────────────────────────────────────────────────

export const getDashboardOrders = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardOrder[]> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data, error } = await db
      .from("orders")
      .select(`*, order_items (id, name, quantity, unit_price_pence, total_pence)`)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return (data ?? []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      customer_email: o.customer_email,
      fulfilment_type: o.fulfilment_type,
      status: o.status,
      payment_status: o.payment_status,
      subtotal_pence: o.subtotal_pence,
      delivery_fee_pence: o.delivery_fee_pence,
      total_pence: o.total_pence,
      notes: o.notes,
      created_at: o.created_at,
      items: (o.order_items ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit_price_pence: i.unit_price_pence,
        total_pence: i.total_pence,
      })),
    }));
  });

// ─── getDashboardMenu ─────────────────────────────────────────────────────────

export const getDashboardMenu = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardMenuData | null> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Get the active menu (or first)
    // Prefer the active menu; fall back to the most recently created
    const { data: menus, error: mErr } = await db
      .from("menus")
      .select("id, is_active")
      .eq("restaurant_id", restaurantId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true });

    if (mErr) throw new Error(mErr.message);
    const activeMenu = menus?.[0];
    if (!activeMenu) return null;

    const { data: cats, error: cErr } = await db
      .from("menu_categories")
      .select(`
        id, name, sort_order,
        menu_items (id, name, description, price_pence, image_url, is_available, is_featured, sort_order, dietary_labels, allergens, calories_kcal, spice_level)
      `)
      .eq("restaurant_id", restaurantId)
      .eq("menu_id", activeMenu.id)
      .order("sort_order");

    if (cErr) throw new Error(cErr.message);

    return {
      menuId: activeMenu.id,
      categories: (cats ?? []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        sort_order: cat.sort_order,
        items: [...((cat.menu_items as DashboardMenuItem[]) ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order),
      })),
    };
  });

// ─── getDashboardCustomers ────────────────────────────────────────────────────

export const getDashboardCustomers = createServerFn({ method: "GET" })
  .inputValidator((id: string) => z.string().uuid().parse(id))
  .handler(async ({ data: restaurantId }): Promise<DashboardCustomer[]> => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { data, error } = await db
      .from("customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("total_spend_pence", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      total_orders: c.total_orders,
      total_spend_pence: c.total_spend_pence,
      last_order_at: c.last_order_at,
    }));
  });

// ─── updateOrderStatus ────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  "pending", "accepted", "preparing", "ready", "completed", "rejected",
] as const;

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { orderId: string; status: (typeof ORDER_STATUSES)[number] }) =>
      z
        .object({ orderId: z.string().uuid(), status: z.enum(ORDER_STATUSES) })
        .parse(input),
  )
  .handler(async ({ data: { orderId, status } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { data, error } = await db
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

// ─── updateDashboardMenuItem ──────────────────────────────────────────────────

export const updateDashboardMenuItem = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      name?: string;
      description?: string;
      pricePence?: number;
      isAvailable?: boolean;
      isFeatured?: boolean;
      imageUrl?: string | null;
      dietaryLabels?: string[];
      allergens?: string[];
      caloriesKcal?: number | null;
      spiceLevel?: number;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          pricePence: z.number().int().positive().optional(),
          isAvailable: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          imageUrl: z.string().url().nullable().optional(),
          dietaryLabels: z.array(z.string()).optional(),
          allergens: z.array(z.string()).optional(),
          caloriesKcal: z.number().int().positive().nullable().optional(),
          spiceLevel: z.number().int().min(0).max(3).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data: { id, ...rest } }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { data, error } = await db
      .from("menu_items")
      .update({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.description !== undefined && { description: rest.description }),
        ...(rest.pricePence !== undefined && { price_pence: rest.pricePence }),
        ...(rest.isAvailable !== undefined && { is_available: rest.isAvailable }),
        ...(rest.isFeatured !== undefined && { is_featured: rest.isFeatured }),
        ...(rest.imageUrl !== undefined && { image_url: rest.imageUrl }),
        ...(rest.dietaryLabels !== undefined && { dietary_labels: rest.dietaryLabels }),
        ...(rest.allergens !== undefined && { allergens: rest.allergens }),
        ...(rest.caloriesKcal !== undefined && { calories_kcal: rest.caloriesKcal }),
        ...(rest.spiceLevel !== undefined && { spice_level: rest.spiceLevel }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

// ─── createDashboardMenuItem ──────────────────────────────────────────────────

export const createDashboardMenuItem = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      categoryId: string;
      name: string;
      description?: string;
      pricePence: number;
      imageUrl?: string | null;
      isFeatured?: boolean;
      dietaryLabels?: string[];
      allergens?: string[];
      caloriesKcal?: number | null;
      spiceLevel?: number;
    }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          categoryId: z.string().uuid(),
          name: z.string().min(1),
          description: z.string().optional(),
          pricePence: z.number().int().positive(),
          imageUrl: z.string().url().nullable().optional(),
          isFeatured: z.boolean().optional(),
          dietaryLabels: z.array(z.string()).optional(),
          allergens: z.array(z.string()).optional(),
          caloriesKcal: z.number().int().positive().nullable().optional(),
          spiceLevel: z.number().int().min(0).max(3).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    // Determine next sort_order
    const { count } = await db
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .eq("category_id", data.categoryId);

    const { data: row, error } = await db
      .from("menu_items")
      .insert({
        restaurant_id: data.restaurantId,
        category_id: data.categoryId,
        name: data.name,
        description: data.description,
        price_pence: data.pricePence,
        image_url: data.imageUrl ?? null,
        is_available: true,
        is_featured: data.isFeatured ?? false,
        dietary_labels: data.dietaryLabels ?? [],
        allergens: data.allergens ?? [],
        calories_kcal: data.caloriesKcal ?? null,
        spice_level: data.spiceLevel ?? 0,
        sort_order: count ?? 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

// ─── createDashboardMenuCategory ─────────────────────────────────────────────

export const createDashboardMenuCategory = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string; menuId: string; name: string }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          menuId: z.string().uuid(),
          name: z.string().min(1),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();

    const { count } = await db
      .from("menu_categories")
      .select("id", { count: "exact", head: true })
      .eq("menu_id", data.menuId);

    const { data: row, error } = await db
      .from("menu_categories")
      .insert({
        restaurant_id: data.restaurantId,
        menu_id: data.menuId,
        name: data.name,
        sort_order: count ?? 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

// ─── saveRestaurantSettings ───────────────────────────────────────────────────

export const saveRestaurantSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      name?: string;
      phone?: string;
      address?: string;
      postcode?: string;
      city?: string;
      email?: string;
      hours?: string;
    }) => z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurants")
      .update({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.phone !== undefined && { phone: rest.phone }),
        ...(rest.address !== undefined && { address: rest.address }),
        ...(rest.postcode !== undefined && { postcode: rest.postcode }),
        ...(rest.city !== undefined && { city: rest.city }),
        ...(rest.email !== undefined && { email: rest.email }),
        ...(rest.hours !== undefined && { hours: rest.hours }),
      })
      .eq("id", restaurantId);

    if (error) throw new Error(error.message);
  });

// ─── saveFullBranding ─────────────────────────────────────────────────────────

export const saveFullBranding = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      restaurantId: string;
      tagline?: string;
      description?: string;
      instagramUrl?: string;
      tiktokUrl?: string;
      facebookUrl?: string;
    }) => z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurant_branding")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...(rest.tagline !== undefined && { tagline: rest.tagline }),
          ...(rest.description !== undefined && { description: rest.description }),
          ...(rest.instagramUrl !== undefined && { instagram_url: rest.instagramUrl || null }),
          ...(rest.tiktokUrl !== undefined && { tiktok_url: rest.tiktokUrl || null }),
          ...(rest.facebookUrl !== undefined && { facebook_url: rest.facebookUrl || null }),
        },
        { onConflict: "restaurant_id" },
      );

    if (error) throw new Error(error.message);
  });

// ─── saveFullTheme ────────────────────────────────────────────────────────────

export const saveFullTheme = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string } & Record<string, unknown>) =>
      z.object({ restaurantId: z.string().uuid() }).passthrough().parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const db = getAdminClient();
    const { restaurantId, ...rest } = data;

    const { error } = await db
      .from("restaurant_theme_configs")
      .upsert(
        {
          restaurant_id: restaurantId,
          ...(rest.themeName !== undefined && { theme_name: rest.themeName }),
          ...(rest.primaryColor !== undefined && { primary_color: rest.primaryColor }),
          ...(rest.accentColor !== undefined && { accent_color: rest.accentColor }),
          ...(rest.backgroundColor !== undefined && { background_color: rest.backgroundColor }),
          ...(rest.buttonColor !== undefined && { button_color: rest.buttonColor }),
          ...(rest.textColor !== undefined && { text_color: rest.textColor }),
          ...(rest.heroLayout !== undefined && { hero_layout: rest.heroLayout }),
          ...(rest.menuLayout !== undefined && { menu_layout: rest.menuLayout }),
          ...(rest.categoryNavigation !== undefined && { category_navigation: rest.categoryNavigation }),
          ...(rest.cartStyle !== undefined && { cart_style: rest.cartStyle }),
          ...(rest.showFeaturedItems !== undefined && { show_featured_items: rest.showFeaturedItems }),
          ...(rest.showOpeningHours !== undefined && { show_opening_hours: rest.showOpeningHours }),
          ...(rest.showBadges !== undefined && { show_badges: rest.showBadges }),
          ...(rest.showReviews !== undefined && { show_reviews: rest.showReviews }),
          ...(rest.ctaText !== undefined && { cta_text: rest.ctaText }),
          ...(rest.enabledPages !== undefined && { enabled_pages: rest.enabledPages }),
        },
        { onConflict: "restaurant_id" },
      );

    if (error) throw new Error(error.message);
  });
