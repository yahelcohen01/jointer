"use server";

import { revalidatePath } from "next/cache";
import {
  type ProfileBasicsFieldError,
  type ProfileBasicsServerError,
  profileBasicsSchema,
} from "@/lib/profile-basics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateProfileBasicsResult =
  | { ok: true }
  | { ok: false; field: "display_name" | "bio" | "language"; error: ProfileBasicsFieldError }
  | { ok: false; error: ProfileBasicsServerError };

export async function updateProfileBasics(formData: FormData): Promise<UpdateProfileBasicsResult> {
  const raw = {
    display_name: formData.get("display_name"),
    bio: formData.get("bio") ?? "",
    language: formData.get("language"),
  };

  const parsed = profileBasicsSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] as "display_name" | "bio" | "language" | undefined;
    return {
      ok: false,
      field: field ?? "display_name",
      error: (issue?.message as ProfileBasicsFieldError) ?? "display_name_required",
    };
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
    .update({
      display_name: parsed.data.display_name,
      bio: parsed.data.bio,
      language: parsed.data.language,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "other" };
  }

  // Surface the new values on the dashboard + invalidate the public page so
  // the language/dir change is reflected on the next visit.
  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/u/[username]", "page");

  return { ok: true };
}
