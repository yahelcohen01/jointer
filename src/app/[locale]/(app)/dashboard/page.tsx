import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProfileBasicsForm } from "@/components/dashboard/ProfileBasicsForm";
import { isLocale, type Locale } from "@/lib/i18n";
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
    .select("display_name, username, bio, language, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding/username");
  }

  if (!profile.onboarded_at) {
    redirect("/onboarding/username");
  }

  const t = await getTranslations("Dashboard");
  const tBasics = await getTranslations("Dashboard.profileBasics");
  const initialLanguage: Locale = isLocale(profile.language) ? profile.language : "he";

  return (
    <main className="mx-auto max-w-md flex-1 w-full px-4 py-12 flex flex-col gap-8">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold font-display">
          {t("greeting", { name: profile.display_name })}
        </h1>
        <p className="text-muted-foreground">@{profile.username}</p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold font-display">{tBasics("title")}</h2>
          <p className="text-sm text-muted-foreground">{tBasics("subtitle")}</p>
        </div>
        <ProfileBasicsForm
          initialDisplayName={profile.display_name}
          initialBio={profile.bio ?? ""}
          initialLanguage={initialLanguage}
        />
      </section>
    </main>
  );
}
