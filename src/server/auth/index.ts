/**
 * Auth server functions
 *
 * TODO: implement with Supabase Auth.
 * TanStack Start server functions are defined with `createServerFn`.
 *
 * Example:
 *   import { createServerFn } from "@tanstack/react-start";
 *   import { supabase } from "@/lib/supabase";
 *
 *   export const signIn = createServerFn({ method: "POST" })
 *     .validator((d: { email: string; password: string }) => d)
 *     .handler(async ({ data }) => {
 *       const { error, data: session } = await supabase.auth.signInWithPassword(data);
 *       if (error) throw new Error(error.message);
 *       return session;
 *     });
 */
