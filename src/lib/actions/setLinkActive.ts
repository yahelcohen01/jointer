"use server";

import { revalidatePath } from "next/cache";
import * as linksDb from "@/lib/db/links";
import type { LinkServerError } from "@/lib/links";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SetLinkActiveResult = { ok: true } | { ok: false; error: LinkServerError };

export async function setLinkActive(
  linkId: string,
  isActive: boolean,
): Promise<SetLinkActiveResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const link = await linksDb.update(supabase, linkId, { is_active: isActive });
  if (!link) return { ok: false, error: "not_found" };

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/u/[username]", "page");

  return { ok: true };
}
