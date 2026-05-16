"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAvatar } from "@/lib/actions/updateAvatar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

interface Props {
  userId: string;
  displayName: string;
  initialAvatarUrl: string | null;
  onAvatarChange?: (url: string | null) => void;
}

export function AvatarUpload({ userId, displayName, initialAvatarUrl, onAvatarChange }: Props) {
  const t = useTranslations("Dashboard.avatar");
  const tErr = useTranslations("Dashboard.avatar.errors");
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [pending, startTransition] = useTransition();
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const handlePick = () => inputRef.current?.click();

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_MIME.has(file.type)) {
      toast.error(tErr("invalid_type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(tErr("too_large"));
      return;
    }

    startTransition(async () => {
      const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${userId}/avatar${ext ? `.${ext}` : ""}`;
      const supabase = createSupabaseBrowserClient();

      const upload = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "0" });
      if (upload.error) {
        toast.error(tErr("upload_failed"));
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Bust browser cache so the same path with new content refreshes.
      const cacheBusted = `${data.publicUrl}?v=${Date.now()}`;

      const result = await updateAvatar(cacheBusted);
      if (!result.ok) {
        toast.error(tErr(result.error));
        return;
      }

      setAvatarUrl(cacheBusted);
      onAvatarChange?.(cacheBusted);
      toast.success(t("uploaded"));
    });
  };

  const handleRemove = () => {
    if (!avatarUrl) return;
    startTransition(async () => {
      const result = await updateAvatar(null);
      if (!result.ok) {
        toast.error(tErr(result.error));
        return;
      }
      setAvatarUrl(null);
      onAvatarChange?.(null);
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="size-16 rounded-full overflow-hidden bg-accent text-accent-foreground flex items-center justify-center text-2xl font-bold font-display shrink-0">
        {avatarUrl ? (
          <Image
            key={avatarUrl}
            src={avatarUrl}
            alt={displayName}
            width={64}
            height={64}
            className="size-16 object-cover"
            unoptimized
          />
        ) : (
          <span aria-hidden>{initial}</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePick}
            disabled={pending}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? t("uploading") : avatarUrl ? t("replace") : t("upload")}
          </button>
          {avatarUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
            >
              {t("remove")}
            </button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
