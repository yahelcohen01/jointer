"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("פרטי ההתחברות שגויים. נסו שוב.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
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
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        className="w-full rounded-lg border border-border bg-background text-foreground px-4 py-3 font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
      >
        התחברו עם Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>או</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          סיסמה
        </label>
        <input
          id="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-start focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          type="submit"
          disabled={pending || !email || !password}
          className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "מתחבר…" : "התחברות"}
        </button>

        {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}

        <p className="text-sm text-center text-muted-foreground">
          אין לכם חשבון?{" "}
          <Link href="/signup" className="underline hover:text-foreground">
            הירשמו
          </Link>
        </p>
      </form>
    </div>
  );
}
