export const POLARIA_THEME_STORAGE_KEY = "polaria-theme" as const;

export type PolariaTheme = "dark" | "light";

export const POLARIA_THEME_DEFAULT: PolariaTheme = "dark";

export function isPolariaTheme(value: unknown): value is PolariaTheme {
  return value === "dark" || value === "light";
}

export function applyPolariaTheme(theme: PolariaTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

/** Lee el tema persistido (zustand persist) sin hidratar el store. */
export function readStoredPolariaTheme(): PolariaTheme {
  if (typeof window === "undefined") return POLARIA_THEME_DEFAULT;
  try {
    const raw = window.localStorage.getItem(POLARIA_THEME_STORAGE_KEY);
    if (!raw) return POLARIA_THEME_DEFAULT;
    const parsed = JSON.parse(raw) as { state?: { theme?: unknown } };
    return isPolariaTheme(parsed?.state?.theme)
      ? parsed.state.theme
      : POLARIA_THEME_DEFAULT;
  } catch {
    return POLARIA_THEME_DEFAULT;
  }
}
