import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
  );
}

// Node.js 20 has no native WebSocket, so Supabase Realtime throws during SSR.
// When import.meta.env.SSR is true (server build), dynamically import the
// `ws` package and pass it as the Realtime transport.
// Vite substitutes import.meta.env.SSR → false in client builds, so this
// branch is dead code and `ws` is never included in the browser bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _wsTransport: any;
if (import.meta.env.SSR) {
  _wsTransport = (await import("ws")).default;
}

/**
 * Anon Supabase client — respects RLS.
 * Safe to import in components and client-side hooks.
 * Also SSR-safe (provides ws transport on Node.js 20).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  ...(_wsTransport
    ? { realtime: { transport: _wsTransport as unknown as typeof WebSocket } }
    : {}),
});
