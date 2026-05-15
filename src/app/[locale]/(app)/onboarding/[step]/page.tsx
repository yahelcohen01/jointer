import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NicheForm } from "@/components/onboarding/NicheForm";
import { ThemeForm } from "@/components/onboarding/ThemeForm";
import { UsernameForm } from "@/components/onboarding/UsernameForm";
import { getById, getReservedUsernames } from "@/lib/db/profiles";
import { isNiche, type Niche } from "@/lib/niche";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultThemeId, isThemeId } from "@/lib/themes";

interface Props {
  params: Promise<{ step: string }>;
}

const KNOWN_STEPS = new Set(["username", "niche", "theme"]);

export default async function OnboardingStepPage({ params }: Props) {
  const { step } = await params;

  if (!KNOWN_STEPS.has(step)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  if (step === "username") {
    const [profile, reservedList] = await Promise.all([
      getById(supabase, user.id),
      getReservedUsernames(supabase),
    ]);

    // Slice 3's callback bootstraps a placeholder username like `user_xxxxxxxx`.
    // Start the form with an empty field rather than pre-filling that placeholder.
    const initialUsername = profile?.username?.startsWith("user_") ? "" : (profile?.username ?? "");

    const t = await getTranslations("Onboarding.username");

    return (
      <main className="mx-auto max-w-sm flex-1 px-4 py-16 flex flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold font-display">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>
        <UsernameForm initialUsername={initialUsername} reservedList={reservedList} />
      </main>
    );
  }

  if (step === "niche") {
    const profile = await getById(supabase, user.id);
    const initialNiche: Niche | null = isNiche(profile?.niche) ? profile.niche : null;

    const t = await getTranslations("Onboarding.niche");

    return (
      <main className="mx-auto max-w-sm flex-1 px-4 py-16 flex flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold font-display">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>
        <NicheForm initialNiche={initialNiche} />
      </main>
    );
  }

  // theme
  const profile = await getById(supabase, user.id);
  const initialThemeId =
    profile?.theme_id && isThemeId(profile.theme_id) ? profile.theme_id : defaultThemeId;

  const t = await getTranslations("Onboarding.theme");

  return (
    <main className="mx-auto max-w-md flex-1 px-4 py-16 flex flex-col gap-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold font-display">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <ThemeForm initialThemeId={initialThemeId} />
    </main>
  );
}
