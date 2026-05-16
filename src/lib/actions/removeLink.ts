"use server";

import { revalidatePath } from "next/cache";
import * as linksDb from "@/lib/db/links";
import type { LinkServerError } from "@/lib/links";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RemoveLinkResult = { ok: true } | { ok: false; error: LinkServerError };

export async function removeLink(linkId: string): Promise<RemoveLinkResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const ok = await linksDb.remove(supabase, linkId);
  if (!ok) return { ok: false, error: "other" };

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/u/[username]", "page");

  return { ok: true };
}
