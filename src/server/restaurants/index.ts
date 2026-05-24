/**
 * Restaurant server functions
 *
 * TODO: replace mock-store calls with real Supabase queries.
 *
 * Example:
 *   import { createServerFn } from "@tanstack/react-start";
 *   import { supabase } from "@/lib/supabase";
 *
 *   export const getRestaurant = createServerFn({ method: "GET" })
 *     .validator((slug: string) => slug)
 *     .handler(async ({ data: slug }) => {
 *       const { data, error } = await supabase
 *         .from("restaurants")
 *         .select("*")
 *         .eq("slug", slug)
 *         .single();
 *       if (error) throw new Error(error.message);
 *       return data;
 *     });
 */
