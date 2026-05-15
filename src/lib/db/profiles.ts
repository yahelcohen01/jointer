import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;

export type Profile = Tables<"profiles">;
export type Link = Tables<"links">;

export interface ProfileWithLinks extends Profile {
  links: Link[];
}

export async function getByUsername(
  client: Client,
  username: string,
): Promise<ProfileWithLinks | null> {
  const { data, error } = await client
    .from("profiles")
    .select(
      `id, username, display_name, bio, avatar_url, theme_id, language, plan, niche, onboarded_at, created_at, updated_at,
       links!links_profile_id_fkey (id, profile_id, title, url, icon, position, is_active, created_at, updated_at)`,
    )
    .eq("username", username)
    .eq("links.is_active", true)
    .order("position", { referencedTable: "links", ascending: true })
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as ProfileWithLinks;
}

export async function getById(client: Client, id: string): Promise<Profile | null> {
  const { data, error } = await client.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function isUsernameAvailable(client: Client, username: string): Promise<boolean> {
  const { data } = await client
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  return data === null;
}

export async function getReservedUsernames(client: Client): Promise<string[]> {
  const { data } = await client.from("reserved_usernames").select("name");
  return data?.map((row) => row.name as string) ?? [];
}

export type UpdateUsernameFailure = "taken" | "reserved" | "unauthorized" | "other";
export type UpdateUsernameResult = { ok: true } | { ok: false; reason: UpdateUsernameFailure };

export async function updateUsername(
  client: Client,
  userId: string,
  username: string,
): Promise<UpdateUsernameResult> {
  const { error } = await client.from("profiles").update({ username }).eq("id", userId);

  if (!error) return { ok: true };

  // 23505 = unique_violation on the username UNIQUE index
  if (error.code === "23505") return { ok: false, reason: "taken" };
  // P0001 = raise_exception, used by the reserved-username trigger
  if (error.code === "P0001") return { ok: false, reason: "reserved" };
  // 42501 = insufficient_privilege, PGRST301 = JWT issues (PostgREST)
  if (error.code === "42501" || error.code === "PGRST301") {
    return { ok: false, reason: "unauthorized" };
  }
  return { ok: false, reason: "other" };
}
