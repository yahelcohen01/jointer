import { notFound, redirect } from "next/navigation";
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

    return (
      <main className="mx-auto max-w-sm flex-1 px-4 py-16 flex flex-col gap-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold font-display">בחרו שם משתמש</h1>
          <p className="text-sm text-muted-foreground">זה ה־URL שתשתפו עם העוקבים שלכם.</p>
        </header>
        <UsernameForm initialUsername={initialUsername} reservedList={reservedList} />
      </main>
    );
  }

  if (PLACEHOLDER_STEPS.has(step)) {
    return (
      <main className="mx-auto max-w-md flex-1 px-4 py-16 flex flex-col items-center text-center gap-3">
        <h1 className="text-3xl font-bold font-display">הקליטה — שלב {step}</h1>
        <p className="text-muted-foreground">השלב הזה ייושם בפרוסה 5.</p>
      </main>
    );
  }

  notFound();
}
