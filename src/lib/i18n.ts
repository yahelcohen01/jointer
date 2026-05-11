export type Locale = "he" | "en";

export const locales = ["he", "en"] as const satisfies readonly Locale[];

export const defaultLocale: Locale = "he";

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "he" ? "rtl" : "ltr";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
