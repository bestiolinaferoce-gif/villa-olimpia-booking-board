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

/** Hex values for each accent used when computing --accent and today overlay vars. */
export const ACCENT_HEX_MAP: Record<BoardAccentId, string> = {
  blue:      "#1d4ed8",
  petrol:    "#0f766e",
  sand:      "#b45309",
  turquoise: "#0891b2",
  plum:      "#7c3aed",
};

export function applyBoardAppearance(theme: BoardThemeMode, accent: BoardAccentId): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.setAttribute("data-accent", accent);
  // Set CSS vars directly so the change takes effect immediately, regardless of
  // whether the page.tsx month-accent useEffect re-runs.
  const hex = ACCENT_HEX_MAP[accent] ?? ACCENT_HEX_MAP.blue;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  html.style.setProperty("--accent", hex);
  html.style.setProperty("--accent-faint", `rgba(${r}, ${g}, ${b}, 0.07)`);
  html.style.setProperty("--today-bg", `rgba(${r}, ${g}, ${b}, 0.04)`);
  html.style.setProperty("--today-border", `rgba(${r}, ${g}, ${b}, 0.2)`);
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
