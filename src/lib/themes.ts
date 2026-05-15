export type ThemeId = "sunrise" | "noir" | "terminal";

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
  noir: {
    id: "noir",
    name: "Noir",
    description: "Deep blacks with a single accent — confident and quiet.",
    previewSwatches: ["#0a0a0a", "#1f1f1f", "#fafafa", "#a78bfa"],
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    description: "Monospaced green-on-black, for the technically inclined.",
    previewSwatches: ["#020a02", "#0a1f0a", "#7ee787", "#56d364"],
  },
};

export const themeIds = Object.keys(themes) as ThemeId[];

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
