"use client";

import { useState } from "react";
import { LinkIcon as LinkIconRender } from "@/components/profile/LinkIcon";
import { LINK_ICON_OPTIONS, type LinkIcon as LinkIconName } from "@/lib/links";

interface Props {
  value: LinkIconName | "";
  onChange: (value: LinkIconName | "") => void;
  label: string;
  searchPlaceholder: string;
  noneLabel: string;
}

export function IconPicker({ value, onChange, label, searchPlaceholder, noneLabel }: Props) {
  const [query, setQuery] = useState("");

  const filtered = LINK_ICON_OPTIONS.filter((name) =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
      <legend className="text-start text-sm font-medium mb-1">{label}</legend>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full rounded-lg border border-border bg-card text-card-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto rounded-lg border border-border bg-card p-2">
        <button
          type="button"
          aria-pressed={value === ""}
          aria-label={noneLabel}
          onClick={() => onChange("")}
          title={noneLabel}
          className={`aspect-square flex items-center justify-center rounded-md text-xs hover:bg-accent hover:text-accent-foreground transition-colors ${
            value === "" ? "bg-accent text-accent-foreground ring-2 ring-primary" : ""
          }`}
        >
          ×
        </button>
        {filtered.map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={value === name}
            aria-label={name}
            onClick={() => onChange(name)}
            title={name}
            className={`aspect-square flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${
              value === name ? "bg-accent text-accent-foreground ring-2 ring-primary" : ""
            }`}
          >
            <LinkIconRender name={name} size={18} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
