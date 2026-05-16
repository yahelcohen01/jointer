"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateAvatarError = "unauthenticated" | "invalid_url" | "other";
export type UpdateAvatarResult = { ok: true } | { ok: false; error: UpdateAvatarError };

// We store the avatar's public Supabase Storage URL on `profiles.avatar_url`.
// The client already performed the upload under `{user_id}/...` (enforced by
// Storage RLS), so we only need to persist the resulting URL here.
export async function updateAvatar(publicUrl: string | null): Promise<UpdateAvatarResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  if (publicUrl !== null) {
    try {
      const parsed = new URL(publicUrl);
      if (parsed.protocol !== "https:") {
        return { ok: false, error: "invalid_url" };
      }
    } catch {
      return { ok: false, error: "invalid_url" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (error) return { ok: false, error: "other" };

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/u/[username]", "page");

  return { ok: true };
}
