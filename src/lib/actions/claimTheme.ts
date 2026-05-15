"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isThemeId } from "@/lib/themes";

export type ClaimThemeError = "invalid_input" | "unauthenticated" | "other";
export type ClaimThemeResult = { ok: false; error: ClaimThemeError };

export async function claimTheme(formData: FormData): Promise<ClaimThemeResult | undefined> {
  const raw = formData.get("themeId");
  if (typeof raw !== "string" || !isThemeId(raw)) {
    return { ok: false, error: "invalid_input" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme_id: raw, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    return { ok: false, error: "other" };
  }

  redirect("/dashboard");
}
