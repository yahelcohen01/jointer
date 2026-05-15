import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
    .select("display_name, username, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding/username");
  }

  if (!profile.onboarded_at) {
    redirect("/onboarding/username");
  }

  const t = await getTranslations("Dashboard");

  return (
    <main className="mx-auto max-w-md flex-1 px-4 py-16 flex flex-col items-center text-center gap-3">
      <h1 className="text-3xl font-bold font-display">
        {t("greeting", { name: profile.display_name })}
      </h1>
      <p className="text-muted-foreground">@{profile.username}</p>
      <p className="text-sm text-muted-foreground">{t("placeholderBody")}</p>
    </main>
  );
}
