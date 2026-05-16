"use server";

import { revalidatePath } from "next/cache";
import * as linksDb from "@/lib/db/links";
import { type LinkFieldError, type LinkServerError, linkSchema } from "@/lib/links";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateLinkResult =
  | { ok: true; id: string }
  | { ok: false; field: "title" | "url"; error: LinkFieldError }
  | { ok: false; error: LinkServerError };

export async function createLink(formData: FormData): Promise<CreateLinkResult> {
  const raw = {
    title: formData.get("title") ?? "",
    url: formData.get("url") ?? "",
    icon: formData.get("icon") ?? "",
  };

  const parsed = linkSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] as "title" | "url" | undefined;
    return {
      ok: false,
      field: field ?? "title",
      error: (issue?.message as LinkFieldError) ?? "title_required",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const link = await linksDb.create(supabase, {
    profileId: user.id,
    title: parsed.data.title,
    url: parsed.data.url,
    icon: parsed.data.icon,
  });

  if (!link) return { ok: false, error: "other" };

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/u/[username]", "page");

  return { ok: true, id: link.id };
}
