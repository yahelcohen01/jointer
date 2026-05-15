"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types/actions";

/**
 * Creates the `profiles` row for a newly signed-up user.
 *
 * Called from the signup form right after `supabase.auth.signUp` returns —
 * at that point the user has no session yet (email is unconfirmed), so the
 * insert must use the service-role admin client to bypass RLS.
 *
 * Idempotent: if the profile already exists (duplicate-key error), we treat
 * that as success.
 */
export async function createUserProfile(
  authUserId: string,
  fullName: string,
): Promise<ActionResult> {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { success: false, error: "name_required" };
  }

  const supabase = createSupabaseAdminClient();
  // Slice 4 lets the user claim a real username; until then we seed a placeholder.
  const initialUsername = `user_${authUserId.slice(0, 8)}`;

  const { error } = await supabase.from("profiles").insert({
    id: authUserId,
    username: initialUsername,
    display_name: trimmed,
  });

  if (error) {
    // 23505 = unique_violation → profile already exists; idempotent success.
    if (error.code === "23505") return { success: true, data: undefined };
    // 23503 = foreign_key_violation → the auth.users row doesn't exist for
    // this id. This usually means the form passed an obfuscated user id
    // (Supabase returns one for already-registered emails). The form should
    // catch this before calling us, but defend in depth.
    if (error.code === "23503") return { success: false, error: "auth_user_not_found" };
    return { success: false, error: "profile_create_failed" };
  }
  return { success: true, data: undefined };
}
