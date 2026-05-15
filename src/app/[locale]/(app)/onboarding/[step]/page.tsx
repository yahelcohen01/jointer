import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { UsernameForm } from "@/components/onboarding/UsernameForm";
import { getById, getReservedUsernames } from "@/lib/db/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ step: string }>;
}

const PLACEHOLDER_STEPS = new Set(["niche", "theme"]);

export default async function OnboardingStepPage({ params }: Props) {
  const { step } = await params;

  if (step === "username") {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }
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

  if (PLACEHOLDER_STEPS.has(step)) {
    const t = await getTranslations("Onboarding.placeholderStep");
    return (
      <main className="mx-auto max-w-md flex-1 px-4 py-16 flex flex-col items-center text-center gap-3">
        <h1 className="text-3xl font-bold font-display">{t("title", { step })}</h1>
        <p className="text-muted-foreground">{t("body")}</p>
      </main>
    );
  }

  notFound();
}
