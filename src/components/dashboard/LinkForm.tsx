"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { IconPicker } from "@/components/dashboard/IconPicker";
import { createLink } from "@/lib/actions/createLink";
import { updateLink } from "@/lib/actions/updateLink";
import {
  LINK_TITLE_MAX,
  LINK_URL_MAX,
  type LinkFieldError,
  type LinkIcon,
  type LinkServerError,
} from "@/lib/links";

interface FormValues {
  title: string;
  url: string;
  icon: LinkIcon | "";
}

interface Props {
  mode: "create" | "edit";
  linkId?: string;
  initialTitle?: string;
  initialUrl?: string;
  initialIcon?: LinkIcon | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function LinkForm({
  mode,
  linkId,
  initialTitle = "",
  initialUrl = "",
  initialIcon = null,
  onSuccess,
  onCancel,
}: Props) {
  const t = useTranslations("Dashboard.links");
  const tErr = useTranslations("Dashboard.links.errors");
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onBlur",
    defaultValues: {
      title: initialTitle,
      url: initialUrl,
      icon: initialIcon ?? "",
    },
  });

  const icon = watch("icon");

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", values.title);
      formData.set("url", values.url);
      formData.set("icon", values.icon);

      const result =
        mode === "create"
          ? await createLink(formData)
          : await updateLink(linkId as string, formData);

      if (result.ok) {
        onSuccess();
        return;
      }
      if ("field" in result) {
        setError(result.field, { message: tErr(result.error as LinkFieldError) });
        return;
      }
      setServerError(tErr((result.error as LinkServerError) ?? "other"));
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="w-full flex flex-col gap-3 rounded-lg border border-border bg-card text-card-foreground p-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`title-${linkId ?? "new"}`} className="text-start text-sm font-medium">
          {t("titleLabel")}
        </label>
        <input
          id={`title-${linkId ?? "new"}`}
          type="text"
          maxLength={LINK_TITLE_MAX}
          {...register("title", { required: "title_required" })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{tErr(errors.title.message as LinkFieldError)}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`url-${linkId ?? "new"}`} className="text-start text-sm font-medium">
          {t("urlLabel")}
        </label>
        <input
          id={`url-${linkId ?? "new"}`}
          type="text"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={LINK_URL_MAX}
          placeholder={t("urlPlaceholder")}
          {...register("url", { required: "url_invalid" })}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          dir="ltr"
        />
        {errors.url ? (
          <p className="text-sm text-destructive">{tErr(errors.url.message as LinkFieldError)}</p>
        ) : null}
      </div>

      <IconPicker
        value={icon}
        onChange={(v) => setValue("icon", v, { shouldDirty: true })}
        label={t("iconLabel")}
        searchPlaceholder={t("iconSearchPlaceholder")}
        noneLabel={t("iconNone")}
      />

      <div className="flex gap-2 mt-1">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? t("submitting") : mode === "create" ? t("submitCreate") : t("submitEdit")}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        ) : null}
      </div>
      {serverError ? <p className="text-sm text-destructive text-center">{serverError}</p> : null}
    </form>
  );
}
