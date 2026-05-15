"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("סיסמה חייבת להיות לפחות 6 תווים.");
      return;
    }
    if (password !== confirm) {
      setError("הסיסמאות לא תואמות.");
      return;
    }
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("שמירת הסיסמה נכשלה. נסו שוב.");
        return;
      }
      // After setting the password, route based on onboarding status — slice 3's
      // callback already redirects unonboarded users to /onboarding/username,
      // so going through /dashboard is safe (it'll bounce if not onboarded).
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium text-start">
        סיסמה חדשה (לפחות 6 תווים)
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

      <label htmlFor="confirm" className="text-sm font-medium text-start">
        אישור סיסמה
      </label>
      <input
        id="confirm"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-start focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <button
        type="submit"
        disabled={pending || !password || !confirm}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "שומר…" : "שמירת סיסמה"}
      </button>

      {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
    </form>
  );
}
