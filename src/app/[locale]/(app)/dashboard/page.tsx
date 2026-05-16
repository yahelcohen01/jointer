import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardEditor } from "@/components/dashboard/DashboardEditor";
import type { PreviewProfile } from "@/components/dashboard/LivePreview";
import * as linksDb from "@/lib/db/links";
import { isLocale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Proxy already gates /(app), but keep the defense-in-depth redirect.
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, bio, language, theme_id, avatar_url, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding/username");
  }

  if (!profile.onboarded_at) {
    redirect("/onboarding/username");
  }

  const t = await getTranslations("Dashboard");
  const links = await linksDb.list(supabase, user.id);

  const initialProfile: PreviewProfile = {
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio ?? "",
    avatar_url: profile.avatar_url,
    theme_id: profile.theme_id,
    language: isLocale(profile.language) ? profile.language : "he",
  };

  return (
    <main className="mx-auto max-w-6xl flex-1 w-full px-4 py-8 flex flex-col gap-8">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold font-display">
          {t("greeting", { name: profile.display_name })}
        </h1>
        <p className="text-muted-foreground">@{profile.username}</p>
      </header>

      <DashboardEditor initialProfile={initialProfile} initialLinks={links} />
    </main>
  );
}
