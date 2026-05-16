"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LinkList } from "@/components/dashboard/LinkList";
import { LivePreview, type PreviewProfile } from "@/components/dashboard/LivePreview";
import { ProfileBasicsForm } from "@/components/dashboard/ProfileBasicsForm";
import type { Link } from "@/lib/db/links";

interface Props {
  initialProfile: PreviewProfile;
  initialLinks: Link[];
}

export function DashboardEditor({ initialProfile, initialLinks }: Props) {
  const tBasics = useTranslations("Dashboard.profileBasics");
  const tLinks = useTranslations("Dashboard.links");

  const [draftProfile, setDraftProfile] = useState<PreviewProfile>(initialProfile);
  const [draftLinks, setDraftLinks] = useState<Link[]>(initialLinks);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="flex flex-col gap-8 min-w-0">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold font-display">{tBasics("title")}</h2>
            <p className="text-sm text-muted-foreground">{tBasics("subtitle")}</p>
          </div>
          <ProfileBasicsForm
            initialDisplayName={initialProfile.display_name}
            initialBio={initialProfile.bio}
            initialLanguage={initialProfile.language}
            onDraftChange={(draft) =>
              setDraftProfile((p) => ({
                ...p,
                display_name: draft.display_name,
                bio: draft.bio,
                language: draft.language,
              }))
            }
          />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold font-display">{tLinks("title")}</h2>
            <p className="text-sm text-muted-foreground">{tLinks("subtitle")}</p>
          </div>
          <LinkList initialLinks={initialLinks} onLinksChange={setDraftLinks} />
        </section>
      </div>

      <LivePreview profile={draftProfile} links={draftLinks} />
    </div>
  );
}
