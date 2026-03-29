import { differenceInDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Booking, GuestProfile } from "@/lib/types";
import { channelLabels, statusLabels } from "@/lib/utils";

/** Formati supportati oggi; estendibile senza cambiare la UI del trigger. */
export type BookingExportFormat = "json" | "txt-notebooklm";

const DOC_LABELS: Partial<Record<NonNullable<GuestProfile["documentType"]>, string>> = {
  CARTA_IDENTITA: "Carta d'identità",
  PASSAPORTO: "Passaporto",
  PATENTE: "Patente",
  PERMESSO_SOGGIORNO: "Permesso di soggiorno",
};

function fmtItDate(iso: string | undefined): string {
  if (!iso?.trim()) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: it });
  } catch {
    return "—";
  }
}

function euroReadable(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function genderLabel(g: GuestProfile["gender"]): string {
  if (g === "M") return "Maschio";
  if (g === "F") return "Femmina";
  return "—";
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sortForExport(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => {
    const c = a.checkIn.localeCompare(b.checkIn);
    if (c !== 0) return c;
    const l = a.lodge.localeCompare(b.lodge, "it");
    if (l !== 0) return l;
    return a.guestName.localeCompare(b.guestName, "it", { sensitivity: "base" });
  });
}

/** Testo unico per NotebookLM (nessun JSON). */
export function generateNotebookLmText(bookings: Booking[]): string {
  const sorted = sortForExport(bookings);
  const now = new Date();
  const headerLines = [
    "VILLA OLIMPIA – ELENCO PRENOTAZIONI PER NOTEBOOKLM",
    `Data export: ${format(now, "dd/MM/yyyy HH:mm", { locale: it })}`,
    "Struttura: Villa Olimpia",
    "Formato: elenco prenotazioni ordinato per check-in",
    "Nota: file pensato come fonte testuale da aggiornare periodicamente in NotebookLM.",
    "",
  ];

  const blocks: string[] = [];
  sorted.forEach((b, i) => {
    let nights = 0;
    try {
      nights = differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn));
    } catch {
      nights = 0;
    }

    const lines: string[] = [
      "⸻",
      "",
      `Prenotazione #${i + 1}`,
      `ID: ${b.id}`,
      `Ospite: ${b.guestName}`,
      `Lodge: ${b.lodge}`,
      `Check-in: ${fmtItDate(b.checkIn)}`,
      `Check-out: ${fmtItDate(b.checkOut)}`,
      `Notti: ${nights > 0 ? String(nights) : "—"}`,
      `Stato: ${statusLabels[b.status] ?? b.status}`,
      `Canale: ${channelLabels[b.channel] ?? b.channel}`,
      `Numero ospiti: ${b.guestsCount}`,
      `Importo totale: ${euroReadable(b.totalAmount)}`,
      `Acconto richiesto: ${euroReadable(b.depositAmount)}`,
      `Acconto ricevuto: ${b.depositReceived ? "Sì" : "No"}`,
    ];

    if (b.touristTax !== undefined && Number.isFinite(b.touristTax)) {
      lines.push(`Tassa di soggiorno: ${euroReadable(b.touristTax)}`);
    }
    if (b.childrenCount !== undefined && Number.isInteger(b.childrenCount)) {
      lines.push(`Bambini: ${b.childrenCount}`);
    }

    const noteText = String(b.notes ?? "").trim();
    lines.push(`Note: ${noteText ? noteText : "Nessuna"}`);
    lines.push(`Data creazione prenotazione: ${fmtItDate(b.createdAt)}`);
    lines.push(`Ultimo aggiornamento: ${fmtItDate(b.updatedAt)}`);

    const p = b.guestProfile;
    if (p) {
      const add = (label: string, v: string | undefined) => {
        const t = v?.trim();
        if (t) lines.push(`${label}: ${t}`);
      };
      add("Cognome", p.surname);
      add("Nome", p.firstName);
      if (p.gender === "M" || p.gender === "F") {
        lines.push(`Sesso: ${genderLabel(p.gender)}`);
      }
      if (p.birthDate?.trim()) {
        lines.push(`Data di nascita: ${fmtItDate(p.birthDate)}`);
      }
      add("Luogo di nascita", p.birthPlace);
      add("Provincia di nascita", p.birthProvince);
      add("Stato di nascita", p.birthCountry);
      add("Nazionalità", p.nationality);
      add("Codice fiscale", p.fiscalCode);
      add("Residenza", p.residence);
      if (p.documentType && DOC_LABELS[p.documentType]) {
        lines.push(`Tipo documento: ${DOC_LABELS[p.documentType]}`);
      } else if (p.documentType) {
        add("Tipo documento", p.documentType);
      }
      add("Numero documento", p.documentNumber);
      add("Luogo rilascio documento", p.documentIssuePlace);
      if (p.documentIssueDate?.trim()) {
        lines.push(`Data rilascio documento: ${fmtItDate(p.documentIssueDate)}`);
      }
    }

    blocks.push(lines.join("\n"));
  });

  return `${headerLines.join("\n")}\n${blocks.join("\n\n")}\n`;
}

export function runBookingExport(
  exportFormat: BookingExportFormat,
  bookings: Booking[],
  opts: { jsonFilenameMonth: Date }
): void {
  if (exportFormat === "json") {
    const payload = {
      exportedAt: new Date().toISOString(),
      bookings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `villa-olimpia-booking-board-${format(opts.jsonFilenameMonth, "yyyy-MM")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  if (exportFormat === "txt-notebooklm") {
    const text = generateNotebookLmText(bookings);
    const dayStamp = format(new Date(), "yyyy-MM-dd");
    downloadTextFile(`villa-olimpia-prenotazioni-notebooklm-${dayStamp}.txt`, text);
  }
}
