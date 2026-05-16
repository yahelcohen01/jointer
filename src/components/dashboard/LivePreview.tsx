"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ProfileView, type ProfileViewLink } from "@/components/profile/ProfileView";
import type { Link } from "@/lib/db/links";
import { dirFor, type Locale } from "@/lib/i18n";

export interface PreviewProfile {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme_id: string;
  language: Locale;
}

interface Props {
  profile: PreviewProfile;
  links: Link[];
}

export function LivePreview({ profile, links }: Props) {
  const t = useTranslations("Dashboard.preview");
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const viewLinks: ProfileViewLink[] = links
    .filter((l) => l.is_active)
    .map((l) => ({ id: l.id, title: l.title, url: l.url, icon: l.icon }));

  return (
    <aside className="lg:sticky lg:top-6 self-start w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold font-display">{t("title")}</h2>
        <button
          type="button"
          onClick={() => setOpenOnMobile((v) => !v)}
          className="lg:hidden text-sm text-muted-foreground underline underline-offset-4"
          aria-expanded={openOnMobile}
          aria-controls="live-preview-frame"
        >
          {openOnMobile ? t("hide") : t("show")}
        </button>
      </div>
      <div
        id="live-preview-frame"
        data-theme={profile.theme_id}
        lang={profile.language}
        dir={dirFor(profile.language)}
        className={`${
          openOnMobile ? "block" : "hidden"
        } lg:block rounded-2xl border-4 border-foreground/10 bg-background text-foreground font-sans overflow-hidden`}
      >
        <div className="max-h-[600px] overflow-y-auto">
          <ProfileView
            profile={{
              username: profile.username,
              display_name: profile.display_name || profile.username,
              bio: profile.bio.trim().length > 0 ? profile.bio : null,
              avatar_url: profile.avatar_url,
            }}
            links={viewLinks}
          />
        </div>
      </div>
      <p className="lg:hidden text-xs text-muted-foreground mt-2">{t("mobileHint")}</p>
    </aside>
  );
}
