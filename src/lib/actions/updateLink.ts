"use server";

import { revalidatePath } from "next/cache";
import * as linksDb from "@/lib/db/links";
import { type LinkFieldError, type LinkServerError, linkUpdateSchema } from "@/lib/links";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdateLinkResult =
  | { ok: true }
  | { ok: false; field: "title" | "url"; error: LinkFieldError }
  | { ok: false; error: LinkServerError };

export async function updateLink(linkId: string, formData: FormData): Promise<UpdateLinkResult> {
  const raw: Record<string, unknown> = {};
  const titleEntry = formData.get("title");
  const urlEntry = formData.get("url");
  const iconEntry = formData.get("icon");
  if (titleEntry !== null) raw.title = titleEntry;
  if (urlEntry !== null) raw.url = urlEntry;
  if (iconEntry !== null) raw.icon = iconEntry;

  const parsed = linkUpdateSchema.safeParse(raw);
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

  const link = await linksDb.update(supabase, linkId, parsed.data);
  if (!link) return { ok: false, error: "not_found" };

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/u/[username]", "page");

  return { ok: true };
}
