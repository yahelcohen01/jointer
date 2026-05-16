import { z } from "zod";

export const LINK_TITLE_MAX = 60;
export const LINK_URL_MAX = 2048;

// Curated subset of Lucide icon names. Kept small so the dashboard / public
// page can render them via a static lookup map without pulling the full
// lucide-react surface. Add names here when the picker needs them.
export const LINK_ICON_OPTIONS = [
  "link",
  "globe",
  "at-sign",
  "hash",
  "music",
  "music-2",
  "headphones",
  "podcast",
  "play",
  "video",
  "camera",
  "image",
  "mail",
  "phone",
  "message-circle",
  "send",
  "shopping-bag",
  "shopping-cart",
  "store",
  "credit-card",
  "calendar",
  "map-pin",
  "file-text",
  "book-open",
  "newspaper",
  "rss",
  "heart",
  "star",
  "coffee",
  "gift",
  "briefcase",
  "code",
] as const;

export type LinkIcon = (typeof LINK_ICON_OPTIONS)[number];

export function isLinkIcon(value: unknown): value is LinkIcon {
  return typeof value === "string" && (LINK_ICON_OPTIONS as readonly string[]).includes(value);
}

const DISALLOWED_SCHEMES = ["mailto:", "javascript:", "data:", "tel:", "file:", "ftp:"];

// Normalizes raw URL input:
// - trims whitespace
// - prepends https:// when no scheme is present
// - rejects mailto / javascript / data / etc. up-front so a typo like
//   "mailto:foo@bar.com" never silently turns into "https://mailto:foo@bar.com"
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  const lower = trimmed.toLowerCase();
  if (DISALLOWED_SCHEMES.some((s) => lower.startsWith(s))) {
    return null;
  }

  const hasScheme = /^[a-z][a-z0-9+\-.]*:\/\//i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

const title = z
  .string()
  .trim()
  .min(1, { error: "title_required" })
  .max(LINK_TITLE_MAX, { error: "title_too_long" });

const url = z
  .string()
  .max(LINK_URL_MAX, { error: "url_too_long" })
  .transform((v, ctx) => {
    const normalized = normalizeUrl(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "url_invalid" });
      return z.NEVER;
    }
    return normalized;
  });

const icon = z
  .union([z.literal(""), z.enum(LINK_ICON_OPTIONS)])
  .transform((v) => (v === "" ? null : v));

export const linkSchema = z.object({
  title,
  url,
  icon,
});

// Same shape as `linkSchema` but every field is optional — used by the
// `update` action so callers can patch a single field.
export const linkUpdateSchema = z.object({
  title: title.optional(),
  url: url.optional(),
  icon: icon.optional(),
});

export type LinkInput = z.infer<typeof linkSchema>;
export type LinkUpdateInput = z.infer<typeof linkUpdateSchema>;

export type LinkFieldError = "title_required" | "title_too_long" | "url_invalid" | "url_too_long";
export type LinkServerError = "unauthenticated" | "not_found" | "other";
