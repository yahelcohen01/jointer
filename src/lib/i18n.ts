export type Locale = "he" | "en";

export const locales = ["he", "en"] as const satisfies readonly Locale[];

export const defaultLocale: Locale = "en";

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Pick the locale for an incoming request. Order: cookie → Accept-Language → default.
 *
 * The Accept-Language pass is a permissive substring match — Israeli browsers
 * typically send `he-IL,he;q=0.9,en;q=0.8` and we want any of those to land on
 * /he. We bias toward `he` when both are present in roughly equal q-values
 * because the user has explicitly listed Hebrew at all (most non-Israeli
 * browsers won't list it).
 */
export function negotiateLocale(acceptLanguage: string | null, cookieValue: string | undefined): Locale {
  if (cookieValue && isLocale(cookieValue)) {
    return cookieValue;
  }
  if (acceptLanguage) {
    const ranges = acceptLanguage
      .split(",")
      .map((part) => {
        const [tag, qPart] = part.trim().split(";");
        const q = qPart?.startsWith("q=") ? Number.parseFloat(qPart.slice(2)) : 1;
        return { tag: tag?.toLowerCase() ?? "", q: Number.isFinite(q) ? q : 0 };
      })
      .sort((a, b) => b.q - a.q);
    for (const { tag } of ranges) {
      if (tag.startsWith("he")) return "he";
      if (tag.startsWith("en")) return "en";
    }
  }
  return defaultLocale;
}
