"use client";

import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const STRINGS = {
  google: "התחבר עם Google",
  or: "או",
  emailLabel: "כתובת אימייל",
  emailPlaceholder: "you@example.com",
  send: "שלח קישור התחברות",
  sending: "שולח…",
  sent: "בדקו את האימייל שלכם — שלחנו קישור להתחברות.",
  error: "משהו השתבש. נסו שוב.",
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function sendMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setStatus(error ? "error" : "sent");
    });
  }

  function signInWithGoogle() {
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

  return (
    <div className="w-full flex flex-col gap-4">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        className="w-full rounded-lg border border-border bg-card text-card-foreground px-4 py-3 font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
      >
        {STRINGS.google}
      </button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>{STRINGS.or}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
        <label htmlFor="email" className="text-sm text-start font-medium">
          {STRINGS.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={STRINGS.emailPlaceholder}
          dir="ltr"
          className="rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-start focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={pending || !email}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? STRINGS.sending : STRINGS.send}
        </button>
      </form>

      {status === "sent" ? (
        <p className="text-sm text-center text-muted-foreground">{STRINGS.sent}</p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-center text-destructive">{STRINGS.error}</p>
      ) : null}
    </div>
  );
}
