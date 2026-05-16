"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { LinkForm } from "@/components/dashboard/LinkForm";
import { LinkIcon } from "@/components/profile/LinkIcon";
import { removeLink } from "@/lib/actions/removeLink";
import type { Link } from "@/lib/db/links";
import type { LinkIcon as LinkIconName } from "@/lib/links";

interface Props {
  initialLinks: Link[];
}

export function LinkList({ initialLinks }: Props) {
  const t = useTranslations("Dashboard.links");
  const tErr = useTranslations("Dashboard.links.errors");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    setDeleteError(null);
    if (!confirm(t("confirmDelete"))) return;
    setPendingDelete(id);
    startTransition(async () => {
      const result = await removeLink(id);
      setPendingDelete(null);
      if (!result.ok) {
        setDeleteError(tErr(result.error));
      }
    });
  };

  if (initialLinks.length === 0 && !adding) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t("add")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2" aria-label={t("listLabel")}>
        {initialLinks.map((link) => {
          const isEditing = editingId === link.id;
          if (isEditing) {
            return (
              <li key={link.id}>
                <LinkForm
                  mode="edit"
                  linkId={link.id}
                  initialTitle={link.title}
                  initialUrl={link.url}
                  initialIcon={(link.icon as LinkIconName | null) ?? null}
                  onSuccess={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            );
          }
          return (
            <li
              key={link.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card text-card-foreground px-3 py-2"
            >
              <span className="shrink-0 text-muted-foreground" aria-hidden>
                <LinkIcon name={link.icon} size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{link.title}</p>
                <p
                  className="text-xs text-muted-foreground truncate"
                  dir="ltr"
                  style={{ textAlign: "start" }}
                >
                  {link.url}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setEditingId(link.id);
                }}
                className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {t("edit")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(link.id)}
                disabled={pendingDelete === link.id}
                className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
              >
                {pendingDelete === link.id ? t("deleting") : t("delete")}
              </button>
            </li>
          );
        })}
      </ul>

      {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}

      {adding ? (
        <LinkForm
          mode="create"
          onSuccess={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setAdding(true);
          }}
          className="self-start rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t("add")}
        </button>
      )}
    </div>
  );
}
