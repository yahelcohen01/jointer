import type { Metadata } from "next";
import {
  ProfileView,
  type ProfileViewLink,
  type ProfileViewProfile,
} from "@/components/profile/ProfileView";

// Phase 1 / Slice 1 — hardcoded profile. Slice 4 will fetch by username from Supabase.
const HARDCODED_PROFILE: ProfileViewProfile = {
  username: "yossi",
  display_name: "יוסי לוי",
  bio: "מוזיקאי ומפיק. כל הקישורים שלי במקום אחד.",
  avatar_url: null,
};

const HARDCODED_LINKS: ProfileViewLink[] = [
  {
    id: "1",
    title: "הסינגל החדש בספוטיפיי",
    url: "https://open.spotify.com",
    icon: null,
  },
  {
    id: "2",
    title: "קליפ ביוטיוב",
    url: "https://youtube.com",
    icon: null,
  },
  {
    id: "3",
    title: "להזמין הופעה",
    url: "https://example.com/book",
    icon: null,
  },
];

export const metadata: Metadata = {
  title: `${HARDCODED_PROFILE.display_name} | Jointer`,
  description: HARDCODED_PROFILE.bio ?? undefined,
  openGraph: {
    title: HARDCODED_PROFILE.display_name,
    description: HARDCODED_PROFILE.bio ?? undefined,
    type: "profile",
  },
};

export default function UsernamePage() {
  return <ProfileView profile={HARDCODED_PROFILE} links={HARDCODED_LINKS} />;
}
