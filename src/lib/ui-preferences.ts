export type ThemePreference = "system" | "light" | "dark";
export type TextScalePreference = "standard" | "large";
export type UiPreferences = {
  theme: ThemePreference;
  reducedMotion: boolean;
  textScale: TextScalePreference;
  highContrast: boolean;
  underlineLinks: boolean;
};

const KEY = "kih:ui-preferences:v2";
const LEGACY_KEY = "kih:ui-preferences:v1";

export const defaultUiPreferences: UiPreferences = {
  theme: "system",
  reducedMotion: false,
  textScale: "standard",
  highContrast: false,
  underlineLinks: false,
};

export function loadUiPreferences(): UiPreferences {
  if (typeof window === "undefined") return defaultUiPreferences;
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY) || "{}";
    return { ...defaultUiPreferences, ...JSON.parse(raw) };
  } catch {
    return defaultUiPreferences;
  }
}

export function saveUiPreferences(value: UiPreferences) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(value));
}

export function applyUiPreferences(value: UiPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (value.theme === "system") delete root.dataset.theme;
  else root.dataset.theme = value.theme;
  root.dataset.reduceMotion = value.reducedMotion ? "true" : "false";
  root.dataset.textScale = value.textScale;
  root.dataset.highContrast = value.highContrast ? "true" : "false";
  root.dataset.underlineLinks = value.underlineLinks ? "true" : "false";

  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = value.theme === "dark" || (value.theme === "system" && prefersDark);
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#15191E" : "#182433";
}
