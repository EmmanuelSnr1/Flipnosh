import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

// Public event types allowed by RLS policy
const PUBLIC_EVENT_TYPES = ["qr_scan", "page_view", "storefront_view"] as const;

// ─── trackEvent ───────────────────────────────────────────────────────────────

export const trackEvent = createServerFn({ method: "POST" })
  .validator(
    (input: {
      restaurantId: string;
      type: string;
      payload?: Record<string, unknown>;
    }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          type: z.string().min(1),
          payload: z.record(z.unknown()).optional().default({}),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getServerClient();
    const { error } = await db.from("events").insert({
      restaurant_id: data.restaurantId,
      type: data.type,
      payload: data.payload as Json,
    });
    if (error) throw new Error(error.message);
  });

// ─── trackQrScan ──────────────────────────────────────────────────────────────

export const trackQrScan = createServerFn({ method: "POST" })
  .validator(
    (input: { restaurantId: string; campaignId: string; sourceKey: string }) =>
      z
        .object({
          restaurantId: z.string().uuid(),
          campaignId: z.string().uuid(),
          sourceKey: z.string(),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getServerClient();

    // Increment scan count on the campaign
    await db.rpc("increment_qr_scans" as never, {
      campaign_id: data.campaignId,
    });

    // Log the event
    await db.from("events").insert({
      restaurant_id: data.restaurantId,
      type: "qr_scan",
      payload: { campaign_id: data.campaignId, source_key: data.sourceKey } as Json,
    });
  });
