/**
 * Preferenze UI board (tema chiaro/scuro + accento): solo localStorage + attributi su <html>.
 * Nessun legame con lo store prenotazioni.
 */

export const STORAGE_THEME_KEY = "vob-board-theme";
export const STORAGE_ACCENT_KEY = "vob-board-accent";

export type BoardThemeMode = "light" | "dark";
export type BoardAccentId = "blue" | "petrol" | "sand" | "turquoise" | "plum";

const ACCENT_IDS: BoardAccentId[] = ["blue", "petrol", "sand", "turquoise", "plum"];

export function isBoardAccentId(v: string): v is BoardAccentId {
  return ACCENT_IDS.includes(v as BoardAccentId);
}

export const BOARD_ACCENT_OPTIONS: { id: BoardAccentId; label: string }[] = [
  { id: "blue", label: "Blu" },
  { id: "petrol", label: "Verde petrolio" },
  { id: "sand", label: "Sabbia / oro" },
  { id: "turquoise", label: "Turchese" },
  { id: "plum", label: "Prugna" },
];

export function applyBoardAppearance(theme: BoardThemeMode, accent: BoardAccentId): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.setAttribute("data-accent", accent);
  try {
    localStorage.setItem(STORAGE_THEME_KEY, theme);
    localStorage.setItem(STORAGE_ACCENT_KEY, accent);
  } catch {
    /* ignore */
  }
}

export function readBoardThemeFromDocument(): BoardThemeMode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function readBoardAccentFromDocument(): BoardAccentId {
  if (typeof document === "undefined") return "blue";
  const a = document.documentElement.getAttribute("data-accent");
  return a && isBoardAccentId(a) ? a : "blue";
}
