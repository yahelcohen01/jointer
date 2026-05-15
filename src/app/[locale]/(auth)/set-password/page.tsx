import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /set-password is only meaningful inside an authenticated session — either
  // the user just clicked a "set password" email link (in which case
  // /auth/callback has already given them a session and forwarded here), or
  // they're a signed-in user adding a password to their account.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold font-display">הגדרת סיסמה</h1>
        <p className="text-sm text-muted-foreground">
          הגדירו סיסמה לחשבון שלכם — תוכלו להתחבר איתה בנוסף ל־Google.
        </p>
      </header>
      <SetPasswordForm />
    </div>
  );
}
