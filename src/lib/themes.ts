export type ThemeId = "sunrise";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  previewSwatches: readonly [string, string, string, string];
}

export const themes: Record<ThemeId, Theme> = {
  sunrise: {
    id: "sunrise",
    name: "Sunrise",
    description: "Warm cream and amber — the friendly default.",
    previewSwatches: ["#fff7ed", "#fed7aa", "#ea580c", "#7c2d12"],
  },
};

export const defaultThemeId: ThemeId = "sunrise";

export function getTheme(id: string | null | undefined): Theme {
  if (id && id in themes) {
    return themes[id as ThemeId];
  }
  return themes[defaultThemeId];
}

export function isThemeId(value: string): value is ThemeId {
  return value in themes;
}
