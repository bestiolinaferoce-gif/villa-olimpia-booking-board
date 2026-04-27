/**
 * Alloggiati Web — payload builder.
 *
 * Builds the fixed-width text record required by the Alloggiati Web portal
 * (Polizia di Stato). This is a pure function: it never sends HTTP requests.
 *
 * When credentials and the actual web service endpoint are available, a future
 * adapter can call `buildAlloggiatiRow()` and POST/upload the result.
 *
 * Tracciato record tipo "16" (ospite singolo):
 *   Pos 1-2   Tipo record            "16"
 *   Pos 3-12  Data arrivo            dd/MM/yyyy
 *   Pos 13-16 Numero pernottamenti   0001
 *   Pos 17-66 Cognome                50 chars
 *   Pos 67-96 Nome                   30 chars
 *   Pos 97    Sesso                  1=M 2=F 9=ND
 *   Pos 98-107 Data di nascita       dd/MM/yyyy
 *   Pos 108-116 Comune nascita       codice belfiore 9 chars
 *   Pos 117-118 Provincia nascita    sigla 2 chars
 *   Pos 119-127 Stato nascita        codice 9 chars
 *   Pos 128-136 Cittadinanza         codice 9 chars
 *   Pos 137-141 Tipo documento       5 chars
 *   Pos 142-161 Numero documento     20 chars
 *   Pos 162-170 Luogo rilascio doc   9 chars
 */

import { differenceInDays, parseISO } from "date-fns";
import type { Booking, GuestProfile } from "@/lib/types";

const DOC_TYPE_MAP: Record<string, string> = {
  CARTA_IDENTITA: "IDENT",
  PASSAPORTO: "PASOR",
  PATENTE: "PATEG",
  PERMESSO_SOGGIORNO: "PERMS",
};

function fmtDate(d?: string): string {
  if (!d) return "          ";
  const [y, m, g] = d.split("-");
  return `${g}/${m}/${y}`;
}

function pad(s: string, len: number): string {
  return s.substring(0, len).padEnd(len, " ");
}

function padNum(n: number, len: number): string {
  return String(n).padStart(len, "0");
}

/** Returns the fixed-width Alloggiati row string, or null if data is insufficient. */
export function buildAlloggiatiRow(booking: Booking): string | null {
  const p: GuestProfile = booking.guestProfile ?? {};
  const nights = differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
  if (nights <= 0) return null;

  const gender = p.gender === "M" ? "1" : p.gender === "F" ? "2" : "9";
  const docType = DOC_TYPE_MAP[p.documentType ?? ""] ?? "IDENT";

  return [
    "16",
    fmtDate(booking.checkIn),
    padNum(nights, 4),
    pad(p.surname ?? booking.guestName, 50),
    pad(p.firstName ?? "", 30),
    gender,
    fmtDate(p.birthDate),
    pad(p.birthPlace ?? "", 9),
    pad(p.birthProvince ?? "  ", 2),
    pad(p.birthCountry ?? "Z000", 9),
    pad(p.nationality ?? "Z000", 9),
    pad(docType, 5),
    pad(p.documentNumber ?? "", 20),
    pad(p.documentIssuePlace ?? "", 9),
  ].join("");
}

/** Returns true when all mandatory fields for Alloggiati are present. */
export function isAlloggiatiReady(booking: Booking): boolean {
  const p = booking.guestProfile ?? {};
  return !!(
    p.surname &&
    p.firstName &&
    p.gender &&
    p.birthDate &&
    p.birthPlace &&
    p.birthCountry &&
    p.nationality &&
    p.documentType &&
    p.documentNumber &&
    p.documentIssuePlace
  );
}

/**
 * Builds a downloadable .txt file content for a single booking.
 * Returns the row as a string (CRLF terminated) or null if data missing.
 */
export function buildAlloggiatiFileContent(booking: Booking): string | null {
  const row = buildAlloggiatiRow(booking);
  if (!row) return null;
  return row + "\r\n";
}

export function alloggiatiFilename(booking: Booking): string {
  return `alloggiati_${booking.guestName.replace(/\s+/g, "_")}_${booking.checkIn}.txt`;
}
