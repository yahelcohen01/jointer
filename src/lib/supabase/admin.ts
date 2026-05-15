import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role Supabase client. Bypasses RLS.
 *
 * Use ONLY when there is no user session yet (e.g. inserting a profile row
 * during signup before the email is confirmed). Never import this from a
 * Client Component — the secret key is server-only.
 */
export function createSupabaseAdminClient() {
  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is required for the admin client");
  }
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
