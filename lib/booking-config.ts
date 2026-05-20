import { parseISO } from "date-fns";

/**
 * Mesi (1-12) in cui è ammessa la prenotazione "Villa Intera".
 * Default: giugno (6) e ottobre (10) — mesi spalla.
 */
export const WHOLE_VILLA_ALLOWED_MONTHS: readonly number[] = [6, 10] as const;

/**
 * Colore base per le barre di tipo evento sul GanttBoard.
 * Coral terracotta richiesto da spec.
 */
export const EVENT_BAR_COLOR = "#C9784A";
export const EVENT_BAR_TEXT = "#3b1e0a";

/**
 * Gradient oro per le barre di tipo Villa Intera.
 */
export const WHOLE_VILLA_BAR_BG = "linear-gradient(90deg, #C9A462 0%, #E2C28A 50%, #C9A462 100%)";
export const WHOLE_VILLA_BAR_TEXT = "#3a2a05";

export function isWholeVillaAllowed(checkInIso: string): boolean {
  if (!checkInIso) return false;
  try {
    const d = parseISO(checkInIso);
    const month = d.getMonth() + 1;
    return WHOLE_VILLA_ALLOWED_MONTHS.includes(month);
  } catch {
    return false;
  }
}

export function wholeVillaAllowedMonthsLabel(): string {
  const names = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  return WHOLE_VILLA_ALLOWED_MONTHS.map((m) => names[m - 1]).join(", ");
}
