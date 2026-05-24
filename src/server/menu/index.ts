import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/supabase";

// ─── getMenuForRestaurant ─────────────────────────────────────────────────────

export const getMenuForRestaurant = createServerFn({ method: "GET" })
  .inputValidator((restaurantId: string) => z.string().uuid().parse(restaurantId))
  .handler(async ({ data: restaurantId }) => {
    const db = getServerClient();

    const { data, error } = await db
      .from("menus")
      .select(
        `
        *,
        menu_categories (
          *,
          menu_items (
            *,
            modifier_groups (
              *,
              modifiers (*)
            )
          )
        )
      `,
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .order("sort_order", { referencedTable: "menu_categories" })
      .order("sort_order", { referencedTable: "menu_categories.menu_items" });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── createCategory ───────────────────────────────────────────────────────────

export const createCategory = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { restaurantId: string; menuId: string; name: string; sortOrder?: number }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          menuId: z.string().uuid(),
          name: z.string().min(1),
          sortOrder: z.number().int().default(0),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getServerClient();
    const insert: TablesInsert<"menu_categories"> = {
      restaurant_id: data.restaurantId,
      menu_id: data.menuId,
      name: data.name,
      sort_order: data.sortOrder,
    };
    const { data: row, error } = await db
      .from("menu_categories")
      .insert(insert)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ─── updateCategory ───────────────────────────────────────────────────────────

export const updateCategory = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { id: string; name?: string; sortOrder?: number }) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).optional(),
          sortOrder: z.number().int().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data: { id, name, sortOrder } }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("menu_categories")
      .update({ ...(name && { name }), ...(sortOrder !== undefined && { sort_order: sortOrder }) })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

// ─── createMenuItem ───────────────────────────────────────────────────────────

const MenuItemSchema = z.object({
  restaurantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  pricePence: z.number().int().positive(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const createMenuItem = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof MenuItemSchema>) => MenuItemSchema.parse(input))
  .handler(async ({ data }) => {
    const db = getServerClient();
    const insert: TablesInsert<"menu_items"> = {
      restaurant_id: data.restaurantId,
      category_id: data.categoryId,
      name: data.name,
      description: data.description,
      price_pence: data.pricePence,
      image_url: data.imageUrl || null,
      is_available: data.isAvailable,
      is_featured: data.isFeatured,
      sort_order: data.sortOrder,
    };
    const { data: row, error } = await db
      .from("menu_items")
      .insert(insert)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

// ─── updateMenuItem ───────────────────────────────────────────────────────────

export const updateMenuItem = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      name?: string;
      description?: string;
      pricePence?: number;
      imageUrl?: string;
      isAvailable?: boolean;
      isFeatured?: boolean;
      sortOrder?: number;
      categoryId?: string;
    }) =>
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          pricePence: z.number().int().positive().optional(),
          imageUrl: z.string().url().optional().or(z.literal("")),
          isAvailable: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
          categoryId: z.string().uuid().optional(),
        })
        .parse(input),
  )
  .handler(async ({ data: { id, ...rest } }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("menu_items")
      .update({
        ...(rest.name !== undefined && { name: rest.name }),
        ...(rest.description !== undefined && { description: rest.description }),
        ...(rest.pricePence !== undefined && { price_pence: rest.pricePence }),
        ...(rest.imageUrl !== undefined && { image_url: rest.imageUrl || null }),
        ...(rest.isAvailable !== undefined && { is_available: rest.isAvailable }),
        ...(rest.isFeatured !== undefined && { is_featured: rest.isFeatured }),
        ...(rest.sortOrder !== undefined && { sort_order: rest.sortOrder }),
        ...(rest.categoryId !== undefined && { category_id: rest.categoryId }),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

// ─── toggleMenuItemAvailability ───────────────────────────────────────────────

export const toggleMenuItemAvailability = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { id: string; isAvailable: boolean }) =>
      z.object({ id: z.string().uuid(), isAvailable: z.boolean() }).parse(input),
  )
  .handler(async ({ data: { id, isAvailable } }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("menu_items")
      .update({ is_available: isAvailable })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });
