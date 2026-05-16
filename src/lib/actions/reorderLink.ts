"use server";

import { revalidatePath } from "next/cache";
import * as linksDb from "@/lib/db/links";
import type { LinkServerError } from "@/lib/links";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReorderLinkResult =
  | { ok: true }
  | { ok: false; error: LinkServerError | "invalid_position" };

export async function reorderLink(linkId: string, newPosition: number): Promise<ReorderLinkResult> {
  if (!Number.isInteger(newPosition) || newPosition < 0) {
    return { ok: false, error: "invalid_position" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const result = await linksDb.reorder(supabase, linkId, newPosition);
  if (!result.ok) {
    if (result.reason === "not_found") return { ok: false, error: "not_found" };
    if (result.reason === "invalid_position") return { ok: false, error: "invalid_position" };
    return { ok: false, error: "other" };
  }

  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/u/[username]", "page");

  return { ok: true };
}
