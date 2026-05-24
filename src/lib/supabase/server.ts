import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import type { Database } from "@/types/supabase";

// NOTE: SUPABASE_SERVICE_ROLE_KEY has no VITE_ prefix — it is never bundled
// into the client. Only use this file inside src/server/** functions.

// VITE_ vars are available via import.meta.env in both client + server.
// Non-VITE_ vars (like SUPABASE_SERVICE_ROLE_KEY) are NOT inlined by Vite —
// they must be read from process.env on the server side.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

const serviceRoleKey =
  (typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY : undefined) ?? "";

const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

/**
 * Admin client — bypasses RLS entirely.
 * Use ONLY in server functions for trusted operations (e.g. creating orders,
 * linking restaurant_users after signup).
 */
// Node.js 20 has no native WebSocket — pass the `ws` package as transport
// so the Supabase Realtime client initialises without throwing.
const realtimeOpts = { transport: ws as unknown as typeof WebSocket };

export function getAdminClient() {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env (server-only, no VITE_ prefix)",
    );
  }
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: realtimeOpts,
  });
}

/**
 * Anon server client — still respects RLS.
 * Use this when you need a Supabase client on the server but don't want
 * to bypass RLS (e.g. reading public storefront data).
 */
export function getServerClient() {
  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: realtimeOpts,
  });
}
