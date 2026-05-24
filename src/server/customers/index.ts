import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";

// ─── getCustomersForRestaurant ────────────────────────────────────────────────

export const getCustomersForRestaurant = createServerFn({ method: "GET" })
  .validator((restaurantId: string) => z.string().uuid().parse(restaurantId))
  .handler(async ({ data: restaurantId }) => {
    const db = getServerClient();
    const { data, error } = await db
      .from("customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("total_spend_pence", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });
