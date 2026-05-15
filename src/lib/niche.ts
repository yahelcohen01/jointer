export const NICHE_OPTIONS = ["creator", "musician", "business", "restaurant", "other"] as const;
export type Niche = (typeof NICHE_OPTIONS)[number];

export function isNiche(value: unknown): value is Niche {
  return typeof value === "string" && (NICHE_OPTIONS as readonly string[]).includes(value);
}
