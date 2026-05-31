/**
 * Storefront order server function.
 *
 * createStorefrontOrder — called from the public /r/:slug/checkout page.
 * Uses the admin client (bypasses RLS) so unauthenticated customers can
 * create orders. The restaurantId is validated server-side.
 *
 * Side effects (best-effort, non-fatal):
 *   - Upserts a customer record
 *   - Inserts an order_placed event
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SelectedModifierSchema = z.object({
  groupName: z.string(),
  optionName: z.string(),
  pricePence: z.number().int().nonnegative(),
});

const OrderItemSchema = z.object({
  menuItemId: z.string().uuid().optional(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPricePence: z.number().int().nonnegative(),
  totalPence: z.number().int().nonnegative(),
  selectedModifiers: z.array(SelectedModifierSchema).default([]),
});

const CreateStorefrontOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  fulfilmentType: z.enum(["pickup", "delivery"]),
  subtotalPence: z.number().int().nonnegative(),
  deliveryFeePence: z.number().int().nonnegative().default(0),
  totalPence: z.number().int().nonnegative(),
  notes: z.string().optional(),
  source: z.string().optional(),
  items: z.array(OrderItemSchema).min(1),
});

export type CreateStorefrontOrderInput = z.infer<typeof CreateStorefrontOrderSchema>;

// ─── createStorefrontOrder ────────────────────────────────────────────────────

export const createStorefrontOrder = createServerFn({ method: "POST" })
  .inputValidator((input: CreateStorefrontOrderInput) =>
    CreateStorefrontOrderSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("@/lib/supabase/server");
    const admin = getAdminClient();

    // ── 1. Generate sequential order number (restaurant-scoped) ───────────────
    const { count } = await admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", data.restaurantId);
    const orderNumber = `#${1000 + (count ?? 0) + 1}`;

    // ── 2. Insert order ───────────────────────────────────────────────────────
    const firstName = data.customerName.trim().split(/\s+/)[0] ?? data.customerName.trim();
    const orderName = `${orderNumber} ${firstName}`;

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        restaurant_id:     data.restaurantId,
        order_number:      orderNumber,
        order_name:        orderName,
        customer_name:     data.customerName,
        customer_phone:    data.customerPhone?.trim() || null,
        customer_email:    data.customerEmail?.trim().toLowerCase() || null,
        fulfilment_type:   data.fulfilmentType,
        subtotal_pence:    data.subtotalPence,
        delivery_fee_pence: data.deliveryFeePence,
        total_pence:       data.totalPence,
        notes:             data.notes || null,
        source:            data.source || null,
        status:            "pending",
        payment_status:    "unpaid",
      })
      .select()
      .single();

    if (orderErr) throw new Error(orderErr.message);

    // ── 3. Insert order items ─────────────────────────────────────────────────
    const { error: itemsErr } = await admin.from("order_items").insert(
      data.items.map((item) => ({
        restaurant_id:      data.restaurantId,
        order_id:           order.id,
        menu_item_id:       item.menuItemId ?? null,
        name:               item.name,
        quantity:           item.quantity,
        unit_price_pence:   item.unitPricePence,
        total_pence:        item.totalPence,
        selected_modifiers: item.selectedModifiers as never,
      })),
    );

    if (itemsErr) throw new Error(itemsErr.message);

    // ── 4. Upsert customer record (best-effort, non-fatal) ────────────────────
    try {
      const phone = data.customerPhone?.trim() || null;
      const email = data.customerEmail?.trim().toLowerCase() || null;

      // Look up existing customer by phone first, then email
      let existing: { id: string; total_orders: number; total_spend_pence: number } | null = null;

      if (phone) {
        const { data: row } = await admin
          .from("customers")
          .select("id, total_orders, total_spend_pence")
          .eq("restaurant_id", data.restaurantId)
          .eq("phone", phone)
          .maybeSingle();
        existing = row ?? null;
      } else if (email) {
        const { data: row } = await admin
          .from("customers")
          .select("id, total_orders, total_spend_pence")
          .eq("restaurant_id", data.restaurantId)
          .eq("email", email)
          .maybeSingle();
        existing = row ?? null;
      }

      if (existing) {
        // Update existing customer stats
        await admin
          .from("customers")
          .update({
            name: data.customerName,
            ...(email ? { email } : {}),
            total_orders: (existing.total_orders ?? 0) + 1,
            total_spend_pence: (existing.total_spend_pence ?? 0) + data.totalPence,
            last_order_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else if (phone || email) {
        // Create new customer record
        await admin.from("customers").insert({
          restaurant_id:     data.restaurantId,
          name:              data.customerName,
          email:             email,
          phone:             phone,
          total_orders:      1,
          total_spend_pence: data.totalPence,
          last_order_at:     new Date().toISOString(),
        });
      }
    } catch {
      // Non-fatal — customer record failure must not block order creation
    }

    // ── 5. Emit new_order event (notification + n8n dispatch, best-effort) ───
    try {
      const { emitOrderEvent } = await import("@/server/events/order-events");
      await emitOrderEvent("new_order", {
        restaurantId:   data.restaurantId,
        orderId:        order.id,
        orderNumber,
        orderName,
        customerName:   data.customerName,
        customerPhone:  data.customerPhone?.trim() || null,
        customerEmail:  data.customerEmail?.trim().toLowerCase() || null,
        fulfilmentType: data.fulfilmentType,
        totalPence:     data.totalPence,
        status:         "pending",
        paymentStatus:  "unpaid",
        source:         data.source ?? null,
      });
    } catch {
      // Non-fatal
    }

    return {
      id:           order.id as string,
      order_number: order.order_number as string,
    };
  });
