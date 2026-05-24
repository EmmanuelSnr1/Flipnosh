import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAdminClient } from "@/lib/supabase/server";

const ORDER_STATUSES = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "rejected",
] as const;

// ─── getOrdersForRestaurant ───────────────────────────────────────────────────

export const getOrdersForRestaurant = createServerFn({ method: "GET" })
  .inputValidator((restaurantId: string) => z.string().uuid().parse(restaurantId))
  .handler(async ({ data: restaurantId }) => {
    const db = getServerClient();

    const { data, error } = await db
      .from("orders")
      .select(
        `
        *,
        order_items (*)
      `,
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── updateOrderStatus ────────────────────────────────────────────────────────

export const updateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { orderId: string; status: (typeof ORDER_STATUSES)[number] }) =>
      z
        .object({
          orderId: z.string().uuid(),
          status: z.enum(ORDER_STATUSES),
        })
        .parse(input),
  )
  .handler(async ({ data: { orderId, status } }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  });

// ─── createOrder (via admin — bypasses RLS for public checkout) ───────────────

const OrderItemSchema = z.object({
  menuItemId: z.string().uuid().optional(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPricePence: z.number().int().nonnegative(),
  totalPence: z.number().int().nonnegative(),
  selectedModifiers: z.array(z.unknown()).default([]),
});

const CreateOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  fulfilmentType: z.enum(["pickup", "delivery"]),
  subtotalPence: z.number().int().nonnegative(),
  deliveryFeePence: z.number().int().nonnegative().default(0),
  totalPence: z.number().int().nonnegative(),
  notes: z.string().optional(),
  source: z.string().optional(),
  items: z.array(OrderItemSchema).min(1),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof CreateOrderSchema>) =>
    CreateOrderSchema.parse(input),
  )
  .handler(async ({ data }) => {
    // Use admin client — public customers can't insert via RLS
    const admin = getAdminClient();

    // Generate order number (timestamp-based, restaurant-scoped)
    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", data.restaurantId);
    const orderNumber = `#${1000 + (count ?? 0) + 1}`;

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        restaurant_id: data.restaurantId,
        order_number: orderNumber,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail,
        fulfilment_type: data.fulfilmentType,
        subtotal_pence: data.subtotalPence,
        delivery_fee_pence: data.deliveryFeePence,
        total_pence: data.totalPence,
        notes: data.notes,
        source: data.source,
        status: "pending",
        payment_status: "unpaid",
      })
      .select()
      .single();

    if (orderErr) throw new Error(orderErr.message);

    const { error: itemsErr } = await admin.from("order_items").insert(
      data.items.map((item) => ({
        restaurant_id: data.restaurantId,
        order_id: order.id,
        menu_item_id: item.menuItemId ?? null,
        name: item.name,
        quantity: item.quantity,
        unit_price_pence: item.unitPricePence,
        total_pence: item.totalPence,
        selected_modifiers: item.selectedModifiers as never,
      })),
    );

    if (itemsErr) throw new Error(itemsErr.message);
    return order;
  });
