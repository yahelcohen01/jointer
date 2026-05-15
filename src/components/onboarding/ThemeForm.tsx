"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { type ClaimThemeError, claimTheme } from "@/lib/actions/claimTheme";
import { type ThemeId, themeIds, themes } from "@/lib/themes";

interface Props {
  initialThemeId: ThemeId;
}

export function ThemeForm({ initialThemeId }: Props) {
  const t = useTranslations("Onboarding.theme");
  const tErr = useTranslations("Onboarding.theme.errors");
  const tThemes = useTranslations("Onboarding.theme.themes");
  const [selected, setSelected] = useState<ThemeId>(initialThemeId);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setServerError(null);
        startTransition(async () => {
          const formData = new FormData();
          formData.set("themeId", selected);
          const result = await claimTheme(formData);
          if (result && !result.ok) {
            setServerError(tErr((result.error as ClaimThemeError) ?? "other"));
          }
        });
      }}
      className="w-full flex flex-col gap-4"
    >
      <div className="grid gap-3">
        {themeIds.map((id) => {
          const checked = selected === id;
          const theme = themes[id];
          return (
            <label
              key={id}
              data-theme={id}
              className={`flex items-center gap-4 rounded-xl border-2 px-4 py-3 cursor-pointer transition-all bg-background text-foreground ${
                checked ? "border-primary shadow-md" : "border-border hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name="themeId"
                value={id}
                checked={checked}
                onChange={() => setSelected(id)}
                className="sr-only"
              />
              <div
                aria-hidden
                className="flex shrink-0 gap-1 rounded-md overflow-hidden border border-border"
              >
                {theme.previewSwatches.map((color, idx) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: swatch order is the identity
                    key={`${id}-${idx}`}
                    style={{ backgroundColor: color }}
                    className="block size-6"
                  />
                ))}
              </div>
              <div className="flex flex-col gap-1 text-start">
                <span className="font-medium font-display">{tThemes(`${id}.name`)}</span>
                <span className="text-sm text-muted-foreground">
                  {tThemes(`${id}.description`)}
                </span>
              </div>
            </label>
          );
        })}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      {serverError ? <p className="text-sm text-destructive text-center">{serverError}</p> : null}
    </form>
  );
}
