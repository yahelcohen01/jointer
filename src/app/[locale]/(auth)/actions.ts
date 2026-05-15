"use server";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

export type SignupAvailability =
  | { state: "available" }
  | { state: "needs_linking"; providers: string[] }
  | { state: "already_registered" };

/**
 * Looks up whether `email` already has an account, and if so what identity
 * providers it has. Used by the signup form to branch between:
 *   - creating a new user (state: "available")
 *   - sending a "set your password" step-up link to an OAuth-only user
 *     (state: "needs_linking")
 *   - telling the visitor to log in instead (state: "already_registered")
 *
 * Uses the admin client because regular Supabase signUp obfuscates existing
 * emails (returns a fake user object) to prevent enumeration. We accept the
 * leak of "is this email registered" in exchange for a usable linking flow.
 */
export async function checkSignupAvailability(
  email: string,
): Promise<ActionResult<SignupAvailability>> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: "email_required" };
  }

  const supabase = createSupabaseAdminClient();
  // `listUsers` is paginated; for a side-project this is fine. If we cross
  // ~1000 users we should switch to a direct query on auth.users via the
  // service-role connection or a SECURITY DEFINER helper.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    return { success: false, error: "lookup_failed" };
  }

  const user = data.users.find((u) => u.email?.toLowerCase() === normalized);
  if (!user) {
    return { success: true, data: { state: "available" } };
  }

  const providers = (user.identities ?? []).map((i) => i.provider);
  if (providers.includes("email")) {
    return { success: true, data: { state: "already_registered" } };
  }
  return { success: true, data: { state: "needs_linking", providers } };
}

/**
 * Sends a magic-link to an existing OAuth-only account so they can link a
 * password to it.
 *
 * Uses `signInWithOtp` (not `resetPasswordForEmail`) because the Supabase
 * default "reset password" email template is misleading for a user who has
 * never set a password. The magic-link template ("Sign in to …") is the
 * least-confusing default.
 *
 * `shouldCreateUser: false` prevents creating a new auth user — the caller
 * has already determined this email belongs to an existing OAuth user via
 * `checkSignupAvailability`.
 *
 * When the recipient clicks the link, /auth/callback exchanges the code and
 * (via `?next=/set-password`) forwards them to the page where they pick a
 * password.
 */
export async function sendPasswordSetupLink(email: string): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: "email_required" };
  }

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl}/auth/callback?next=/set-password`,
    },
  });

  if (error) {
    return { success: false, error: "send_failed" };
  }
  return { success: true, data: undefined };
}
