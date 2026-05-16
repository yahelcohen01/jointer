import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export type Link = Tables<"links">;

export type CreateLinkInput = {
  profileId: string;
  title: string;
  url: string;
  icon: string | null;
};

export type UpdateLinkInput = {
  title?: string;
  url?: string;
  icon?: string | null;
  is_active?: boolean;
  position?: number;
};

export async function list(client: Client, profileId: string): Promise<Link[]> {
  const { data, error } = await client
    .from("links")
    .select("*")
    .eq("profile_id", profileId)
    .order("position", { ascending: true });
  if (error || !data) return [];
  return data;
}

export async function create(client: Client, input: CreateLinkInput): Promise<Link | null> {
  const { data: existing } = await client
    .from("links")
    .select("position")
    .eq("profile_id", input.profileId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (existing?.position ?? -1) + 1;

  const { data, error } = await client
    .from("links")
    .insert({
      profile_id: input.profileId,
      title: input.title,
      url: input.url,
      icon: input.icon,
      position: nextPosition,
    })
    .select()
    .single();

  if (error || !data) return null;
  return data;
}

export async function update(
  client: Client,
  linkId: string,
  patch: UpdateLinkInput,
): Promise<Link | null> {
  const { data, error } = await client
    .from("links")
    .update(patch)
    .eq("id", linkId)
    .select()
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function remove(client: Client, linkId: string): Promise<boolean> {
  const { error } = await client.from("links").delete().eq("id", linkId);
  return !error;
}

export type ReorderFailure = "not_found" | "unauthorized" | "invalid_position" | "other";

export async function reorder(
  client: Client,
  linkId: string,
  newPosition: number,
): Promise<{ ok: true } | { ok: false; reason: ReorderFailure }> {
  const { error } = await client.rpc("reorder_link", {
    p_link_id: linkId,
    p_new_position: newPosition,
  });
  if (!error) return { ok: true };
  const msg = error.message ?? "";
  if (msg.includes("not_found")) return { ok: false, reason: "not_found" };
  if (msg.includes("unauthorized")) return { ok: false, reason: "unauthorized" };
  if (msg.includes("invalid_position")) return { ok: false, reason: "invalid_position" };
  return { ok: false, reason: "other" };
}
