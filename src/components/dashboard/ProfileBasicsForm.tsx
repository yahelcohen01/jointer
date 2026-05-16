"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { updateProfileBasics } from "@/lib/actions/updateProfileBasics";
import type { Locale } from "@/lib/i18n";
import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  type ProfileBasicsFieldError,
  type ProfileBasicsServerError,
  profileBasicsFormSchema,
} from "@/lib/profile-basics";

interface Props {
  initialDisplayName: string;
  initialBio: string;
  initialLanguage: Locale;
  onDraftChange?: (draft: { display_name: string; bio: string; language: Locale }) => void;
}

interface FormValues {
  display_name: string;
  bio: string;
  language: Locale;
}

export function ProfileBasicsForm({
  initialDisplayName,
  initialBio,
  initialLanguage,
  onDraftChange,
}: Props) {
  const t = useTranslations("Dashboard.profileBasics");
  const tErr = useTranslations("Dashboard.profileBasics.errors");
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(profileBasicsFormSchema),
    mode: "onBlur",
    defaultValues: {
      display_name: initialDisplayName,
      bio: initialBio,
      language: initialLanguage,
    },
  });

  const bioValue = watch("bio") ?? "";

  useEffect(() => {
    if (!onDraftChange) return;
    const sub = watch((value) => {
      onDraftChange({
        display_name: value.display_name ?? "",
        bio: value.bio ?? "",
        language: (value.language ?? initialLanguage) as Locale,
      });
    });
    return () => sub.unsubscribe();
  }, [watch, onDraftChange, initialLanguage]);

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("display_name", values.display_name);
      formData.set("bio", values.bio ?? "");
      formData.set("language", values.language);
      const result = await updateProfileBasics(formData);
      if (result.ok) {
        setSaved(true);
        return;
      }
      if ("field" in result) {
        setError(result.field, { message: tErr(result.error as ProfileBasicsFieldError) });
        return;
      }
      setServerError(tErr((result.error as ProfileBasicsServerError) ?? "other"));
    });
  });

  return (
    <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display_name" className="text-start text-sm font-medium">
          {t("displayNameLabel")}
        </label>
        <input
          id="display_name"
          type="text"
          maxLength={DISPLAY_NAME_MAX}
          autoComplete="name"
          {...register("display_name")}
          className="w-full rounded-lg border border-border bg-card text-card-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.display_name ? (
          <p className="text-sm text-destructive">
            {tErr(errors.display_name.message as ProfileBasicsFieldError)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-start text-sm font-medium">
          {t("bioLabel")}
        </label>
        <textarea
          id="bio"
          rows={3}
          maxLength={BIO_MAX}
          {...register("bio")}
          className="w-full rounded-lg border border-border bg-card text-card-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
        <p className="text-xs text-muted-foreground text-end">
          {t("bioHint", { count: bioValue.length, max: BIO_MAX })}
        </p>
        {errors.bio ? (
          <p className="text-sm text-destructive">
            {tErr(errors.bio.message as ProfileBasicsFieldError)}
          </p>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">{t("languageLabel")}</legend>
        <div className="flex gap-2">
          <label className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-card text-card-foreground px-3 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-accent-foreground transition-colors">
            <input type="radio" value="he" {...register("language")} className="accent-primary" />
            <span className="text-sm">{t("languageHe")}</span>
          </label>
          <label className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-card text-card-foreground px-3 py-2 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-accent-foreground transition-colors">
            <input type="radio" value="en" {...register("language")} className="accent-primary" />
            <span className="text-sm">{t("languageEn")}</span>
          </label>
        </div>
        {errors.language ? (
          <p className="text-sm text-destructive">
            {tErr(errors.language.message as ProfileBasicsFieldError)}
          </p>
        ) : null}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {pending ? t("submitting") : t("submit")}
      </button>
      {saved ? <p className="text-sm text-emerald-600 text-center">{t("saved")}</p> : null}
      {serverError ? <p className="text-sm text-destructive text-center">{serverError}</p> : null}
    </form>
  );
}
