import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ProfileView,
  type ProfileViewLink,
  type ProfileViewProfile,
} from "@/components/profile/ProfileView";
import { getByUsername } from "@/lib/db/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTheme } from "@/lib/themes";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();
  const profile = await getByUsername(supabase, username);
  if (!profile) {
    return { title: "Jointer" };
  }
  return {
    title: `${profile.display_name} | Jointer`,
    description: profile.bio ?? undefined,
    openGraph: {
      title: profile.display_name,
      description: profile.bio ?? undefined,
      type: "profile",
      ...(profile.avatar_url ? { images: [{ url: profile.avatar_url }] } : {}),
    },
    twitter: {
      card: "summary",
      title: profile.display_name,
      description: profile.bio ?? undefined,
    },
  };
}

export default async function UsernamePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();
  const profile = await getByUsername(supabase, username);
  if (!profile) {
    notFound();
  }

  const viewProfile: ProfileViewProfile = {
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
  };

  const viewLinks: ProfileViewLink[] = (profile.links ?? [])
    .filter((link) => link.is_active)
    .sort((a, b) => a.position - b.position)
    .map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: link.icon,
    }));

  const theme = getTheme(profile.theme_id);

  return (
    <div
      data-theme={theme.id}
      className="min-h-full flex-1 flex flex-col bg-background text-foreground"
    >
      <ProfileView profile={viewProfile} links={viewLinks} />
    </div>
  );
}
