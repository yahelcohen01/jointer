"use server";

import { redirect } from "next/navigation";
import { getReservedUsernames, updateUsername } from "@/lib/db/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalize, validate } from "@/lib/username";

export type ClaimUsernameError =
  | "invalid_input"
  | "unauthenticated"
  | "too_short"
  | "too_long"
  | "invalid_chars"
  | "leading_or_trailing_separator"
  | "reserved"
  | "taken"
  | "unauthorized"
  | "other";

export type ClaimUsernameResult = { ok: false; error: ClaimUsernameError };

export async function claimUsername(formData: FormData): Promise<ClaimUsernameResult | undefined> {
  const raw = formData.get("username");
  if (typeof raw !== "string") {
    return { ok: false, error: "invalid_input" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const normalized = normalize(raw);
  const reservedList = await getReservedUsernames(supabase);
  const validation = validate(normalized, reservedList);
  if (!validation.ok) {
    return { ok: false, error: validation.reason };
  }

  const result = await updateUsername(supabase, user.id, normalized);
  if (!result.ok) {
    return { ok: false, error: result.reason };
  }

  // Onboarding chains to the niche step (slice 5 implements the real UI;
  // for now it's a placeholder).
  redirect("/onboarding/niche");
}
