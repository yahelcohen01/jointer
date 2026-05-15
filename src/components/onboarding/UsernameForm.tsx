"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type ClaimUsernameError, claimUsername } from "@/lib/actions/claimUsername";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { normalize, validate } from "@/lib/username";

const FAILURE_MESSAGES: Record<ClaimUsernameError | "checking", string> = {
  too_short: "קצר מדי (מינימום 3 תווים)",
  too_long: "ארוך מדי (מקסימום 30 תווים)",
  invalid_chars: "מותר: a–z, 0–9, מקף ומקף תחתון",
  leading_or_trailing_separator: "אסור להתחיל או לסיים במקף או מקף תחתון",
  reserved: "שם המשתמש שמור",
  taken: "שם המשתמש תפוס",
  unauthorized: "אין הרשאה. נסו להתחבר מחדש.",
  unauthenticated: "צריך להתחבר מחדש",
  invalid_input: "קלט לא תקין",
  other: "משהו השתבש. נסו שוב.",
  checking: "בודק זמינות…",
};

interface Props {
  initialUsername: string;
  reservedList: readonly string[];
}

export function UsernameForm({ initialUsername, reservedList }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<"unknown" | "checking" | "available" | "taken">(
    "unknown",
  );
  const [pending, startTransition] = useTransition();

  const schema = z.object({
    username: z
      .string()
      .min(1)
      .transform((v) => normalize(v))
      .superRefine((value, ctx) => {
        const result = validate(value, reservedList);
        if (!result.ok) {
          ctx.addIssue({ code: "custom", message: FAILURE_MESSAGES[result.reason] });
        }
      }),
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
  } = useForm<{ username: string }>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { username: initialUsername },
  });

  async function checkAvailability() {
    const raw = getValues("username");
    const normalized = normalize(raw);
    const validation = validate(normalized, reservedList);
    if (!validation.ok) {
      setAvailability("unknown");
      return;
    }
    setAvailability("checking");
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", normalized)
      .maybeSingle();
    setAvailability(data === null ? "available" : "taken");
  }

  const onSubmit = handleSubmit((data) => {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("username", data.username);
      const result = await claimUsername(formData);
      // Success path: server action redirects; nothing returned here.
      if (result && !result.ok) {
        setServerError(FAILURE_MESSAGES[result.error] ?? FAILURE_MESSAGES.other);
      }
    });
  });

  const fieldError = errors.username?.message;

  return (
    <form onSubmit={onSubmit} className="w-full flex flex-col gap-3">
      <label htmlFor="username" className="text-start text-sm font-medium">
        שם המשתמש
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 start-3 flex items-center text-muted-foreground">
          jointer.co/
        </span>
        <input
          id="username"
          dir="ltr"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          {...register("username")}
          onBlur={checkAvailability}
          className="w-full rounded-lg border border-border bg-card text-card-foreground ps-28 pe-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {fieldError ? (
        <p className="text-sm text-destructive">{fieldError}</p>
      ) : availability === "checking" ? (
        <p className="text-sm text-muted-foreground">{FAILURE_MESSAGES.checking}</p>
      ) : availability === "taken" ? (
        <p className="text-sm text-destructive">{FAILURE_MESSAGES.taken}</p>
      ) : availability === "available" ? (
        <p className="text-sm text-emerald-600">פנוי ✓</p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !isValid || availability === "taken"}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? "שומר…" : "המשך"}
      </button>
      {serverError ? <p className="text-sm text-destructive text-center">{serverError}</p> : null}
    </form>
  );
}
