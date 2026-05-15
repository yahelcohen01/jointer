"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  checkSignupAvailability,
  createUserProfile,
  sendPasswordSetupLink,
} from "@/app/[locale]/(auth)/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Stage = "email" | "credentials" | "confirm_email" | "linking_email";

export function SignupForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email) return;
    startTransition(async () => {
      const availability = await checkSignupAvailability(email);
      if (!availability.success) {
        setError("שגיאה בבדיקת האימייל. נסו שוב.");
        return;
      }
      if (availability.data.state === "already_registered") {
        setError("האימייל הזה כבר רשום. נסו להתחבר.");
        return;
      }
      if (availability.data.state === "needs_linking") {
        const sent = await sendPasswordSetupLink(email);
        if (!sent.success) {
          setError("נכשל בשליחת הקישור. נסו שוב.");
          return;
        }
        setStage("linking_email");
        return;
      }
      setStage("credentials");
    });
  }

  function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("חסר שם.");
      return;
    }
    if (password.length < 6) {
      setError("סיסמה חייבת להיות לפחות 6 תווים.");
      return;
    }
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        setError(signUpError.message ?? "ההרשמה נכשלה. נסו שוב.");
        return;
      }
      const authUser = data.user;
      if (!authUser) {
        setError("ההרשמה נכשלה. נסו שוב.");
        return;
      }
      const result = await createUserProfile(authUser.id, fullName);
      if (!result.success) {
        setError("נכשל ביצירת הפרופיל. צרו קשר עם התמיכה.");
        return;
      }
      if (data.session) {
        router.push("/onboarding/username");
        router.refresh();
      } else {
        setStage("confirm_email");
      }
    });
  }

  function signUpWithGoogle() {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    });
  }

  if (stage === "confirm_email") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-lg font-medium">בדקו את האימייל שלכם 📬</p>
        <p className="text-sm text-muted-foreground">
          שלחנו אליכם קישור לאימות. אחרי שתאמתו, אתם תועברו אוטומטית להמשך.
        </p>
        <Link href="/login" className="text-sm underline hover:text-foreground">
          חזרה להתחברות
        </Link>
      </div>
    );
  }

  if (stage === "linking_email") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-lg font-medium">מצאנו חשבון Google בכתובת הזו 🔗</p>
        <p className="text-sm text-muted-foreground">
          שלחנו אליכם קישור התחברות. אחרי שתלחצו עליו, תוכלו להגדיר סיסמה ולהתחבר גם איתה.
        </p>
        <Link href="/login" className="text-sm underline hover:text-foreground">
          חזרה להתחברות
        </Link>
      </div>
    );
  }

  if (stage === "credentials") {
    return (
      <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground text-center">
          ממשיכים להרשמה בכתובת{" "}
          <span dir="ltr" className="font-mono">
            {email}
          </span>
        </p>

        <label htmlFor="full-name" className="text-sm font-medium text-start">
          שם
        </label>
        <input
          id="full-name"
          type="text"
          autoComplete="name"
          required
          autoFocus
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-start focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <label htmlFor="password" className="text-sm font-medium text-start">
          סיסמה (לפחות 6 תווים)
        </label>
        <input
          id="password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-start focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          type="submit"
          disabled={pending || !fullName || !password}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "יוצר חשבון…" : "צרו חשבון"}
        </button>

        {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}

        <button
          type="button"
          onClick={() => {
            setStage("email");
            setError(null);
          }}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          שינוי כתובת אימייל
        </button>
      </form>
    );
  }

  // stage === "email"
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={signUpWithGoogle}
        disabled={pending}
        className="w-full rounded-lg border border-border bg-background text-foreground px-4 py-3 font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
      >
        הירשמו עם Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>או</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-medium text-start">
          אימייל
        </label>
        <input
          id="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-border bg-background px-3 py-2 text-start focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          type="submit"
          disabled={pending || !email}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "בודק…" : "המשך"}
        </button>

        {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}

        <p className="text-sm text-center text-muted-foreground">
          כבר יש לכם חשבון?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            התחברו
          </Link>
        </p>
      </form>
    </div>
  );
}
