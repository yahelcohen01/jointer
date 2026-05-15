"use server";

import { redirect } from "next/navigation";
import { isNiche } from "@/lib/niche";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ClaimNicheError = "invalid_input" | "unauthenticated" | "other";
export type ClaimNicheResult = { ok: false; error: ClaimNicheError };

export async function claimNiche(formData: FormData): Promise<ClaimNicheResult | undefined> {
  const raw = formData.get("niche");
  if (!isNiche(raw)) {
    return { ok: false, error: "invalid_input" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "unauthenticated" };
  }

  const { error } = await supabase.from("profiles").update({ niche: raw }).eq("id", user.id);
  if (error) {
    return { ok: false, error: "other" };
  }

  redirect("/onboarding/theme");
}
