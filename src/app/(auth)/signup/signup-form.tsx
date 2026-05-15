"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createUserProfile } from "@/app/(auth)/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
        const msg = signUpError.message?.toLowerCase() ?? "";
        if (msg.includes("already") || msg.includes("registered")) {
          setError("האימייל הזה כבר רשום. נסו להתחבר.");
        } else if (msg.includes("rate")) {
          setError("יותר מדי ניסיונות. המתינו רגע ונסו שוב.");
        } else {
          setError(signUpError.message ?? "ההרשמה נכשלה. נסו שוב.");
        }
        return;
      }
      const authUser = data.user;
      if (!authUser) {
        setError("ההרשמה נכשלה. נסו שוב.");
        return;
      }
      // Supabase obfuscates existing-email responses to prevent enumeration:
      // when "Confirm email" is ON and the address is already registered, the
      // returned user object has identities = []. Detect that and stop here
      // rather than passing a fake auth.uid() to the profile insert.
      if (authUser.identities && authUser.identities.length === 0) {
        setError("האימייל הזה כבר רשום. נסו להתחבר.");
        return;
      }
      const result = await createUserProfile(authUser.id, fullName);
      if (!result.success) {
        setError("נכשל ביצירת הפרופיל. צרו קשר עם התמיכה.");
        return;
      }
      // If Supabase has email-confirmation disabled, signUp returns a session
      // and we can go straight to onboarding. Otherwise, prompt to confirm.
      if (data.session) {
        router.push("/onboarding/username");
        router.refresh();
      } else {
        setEmailSent(true);
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

  if (emailSent) {
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label htmlFor="full-name" className="text-sm font-medium text-start">
          שם
        </label>
        <input
          id="full-name"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-start focus:outline-none focus:ring-2 focus:ring-ring"
        />

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
          disabled={pending || !fullName || !email || !password}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "יוצר חשבון…" : "צרו חשבון"}
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
