"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { type ClaimNicheError, claimNiche } from "@/lib/actions/claimNiche";
import { NICHE_OPTIONS, type Niche } from "@/lib/niche";

interface Props {
  initialNiche: Niche | null;
}

export function NicheForm({ initialNiche }: Props) {
  const t = useTranslations("Onboarding.niche");
  const tErr = useTranslations("Onboarding.niche.errors");
  const tOpt = useTranslations("Onboarding.niche.options");
  const [selected, setSelected] = useState<Niche | null>(initialNiche);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!selected) return;
        setServerError(null);
        startTransition(async () => {
          const formData = new FormData();
          formData.set("niche", selected);
          const result = await claimNiche(formData);
          if (result && !result.ok) {
            setServerError(tErr((result.error as ClaimNicheError) ?? "other"));
          }
        });
      }}
      className="w-full flex flex-col gap-3"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{t("title")}</legend>
        {NICHE_OPTIONS.map((option) => {
          const checked = selected === option;
          return (
            <label
              key={option}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                checked
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card text-card-foreground hover:bg-accent/40"
              }`}
            >
              <input
                type="radio"
                name="niche"
                value={option}
                checked={checked}
                onChange={() => setSelected(option)}
                className="accent-primary"
              />
              <span className="text-sm font-medium">{tOpt(option)}</span>
            </label>
          );
        })}
      </fieldset>
      <button
        type="submit"
        disabled={pending || !selected}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      {serverError ? <p className="text-sm text-destructive text-center">{serverError}</p> : null}
    </form>
  );
}
