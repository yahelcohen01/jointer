"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { LinkForm } from "@/components/dashboard/LinkForm";
import { LinkIcon } from "@/components/profile/LinkIcon";
import { Switch } from "@/components/ui/switch";
import { removeLink } from "@/lib/actions/removeLink";
import { reorderLink } from "@/lib/actions/reorderLink";
import { setLinkActive } from "@/lib/actions/setLinkActive";
import type { Link } from "@/lib/db/links";
import type { LinkIcon as LinkIconName } from "@/lib/links";

interface Props {
  initialLinks: Link[];
}

type Action =
  | { type: "reorder"; oldIndex: number; newIndex: number }
  | { type: "toggle-active"; id: string; isActive: boolean };

export function LinkList({ initialLinks }: Props) {
  const t = useTranslations("Dashboard.links");
  const tErr = useTranslations("Dashboard.links.errors");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [links, applyOptimistic] = useOptimistic<Link[], Action>(initialLinks, (state, action) => {
    if (action.type === "reorder") {
      return arrayMove(state, action.oldIndex, action.newIndex);
    }
    if (action.type === "toggle-active") {
      return state.map((l) => (l.id === action.id ? { ...l, is_active: action.isActive } : l));
    }
    return state;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleToggleActive = (id: string, isActive: boolean) => {
    startTransition(async () => {
      applyOptimistic({ type: "toggle-active", id, isActive });
      const result = await setLinkActive(id, isActive);
      if (!result.ok) {
        toast.error(tErr(result.error));
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    startTransition(async () => {
      applyOptimistic({ type: "reorder", oldIndex, newIndex });
      const result = await reorderLink(String(active.id), newIndex);
      if (!result.ok) {
        toast.error(tErr(result.error));
      }
    });
  };

  if (links.length === 0 && !adding) {
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2" aria-label={t("listLabel")}>
            {links.map((link) =>
              editingId === link.id ? (
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
              ) : (
                <SortableLinkRow
                  key={link.id}
                  link={link}
                  pendingDelete={pendingDelete === link.id}
                  onEdit={() => {
                    setAdding(false);
                    setEditingId(link.id);
                  }}
                  onDelete={() => handleDelete(link.id)}
                  onToggleActive={(checked) => handleToggleActive(link.id, checked)}
                  labels={{
                    edit: t("edit"),
                    delete: t("delete"),
                    deleting: t("deleting"),
                    dragHandle: t("dragHandle"),
                    activate: t("activate"),
                    deactivate: t("deactivate"),
                    inactiveBadge: t("inactiveBadge"),
                  }}
                />
              ),
            )}
          </ul>
        </SortableContext>
      </DndContext>

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

interface SortableLinkRowProps {
  link: Link;
  pendingDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (checked: boolean) => void;
  labels: {
    edit: string;
    delete: string;
    deleting: string;
    dragHandle: string;
    activate: string;
    deactivate: string;
    inactiveBadge: string;
  };
}

function SortableLinkRow({
  link,
  pendingDelete,
  onEdit,
  onDelete,
  onToggleActive,
  labels,
}: SortableLinkRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-active={link.is_active}
      className="flex items-center gap-2 rounded-lg border border-border bg-card text-card-foreground px-3 py-2 touch-none data-[active=false]:opacity-60 data-[active=false]:border-dashed"
    >
      <button
        type="button"
        aria-label={labels.dragHandle}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} aria-hidden />
      </button>
      <span className="shrink-0 text-muted-foreground" aria-hidden>
        <LinkIcon name={link.icon} size={18} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{link.title}</p>
          {!link.is_active ? (
            <span className="shrink-0 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] uppercase tracking-wide">
              {labels.inactiveBadge}
            </span>
          ) : null}
        </div>
        <p
          className="text-xs text-muted-foreground truncate"
          dir="ltr"
          style={{ textAlign: "start" }}
        >
          {link.url}
        </p>
      </div>
      <Switch
        checked={link.is_active}
        onCheckedChange={onToggleActive}
        aria-label={link.is_active ? labels.deactivate : labels.activate}
        className="shrink-0"
      />
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        {labels.edit}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={pendingDelete}
        className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
      >
        {pendingDelete ? labels.deleting : labels.delete}
      </button>
    </li>
  );
}
