import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Booking } from "@/lib/types";
import type { BookingConflict } from "@/lib/reconciliation";

export type InsightSeverity = "critical" | "warning" | "info" | "success";

export type InsightCategory =
  | "conflitti"
  | "caparre"
  | "checkin"
  | "checkout"
  | "opzioni"
  | "adempimenti"
  | "nuove"
  | "sync"
  | "economia";

export type BoardInsight = {
  id: string;
  severity: InsightSeverity;
  category: InsightCategory;
  title: string;
  detail: string;
  bookingIds: string[];
  amount?: number;
};

export type BoardEconomics = {
  /** Revenue confermato dei soggiorni in corso e futuri (totale prenotazioni confermate non concluse). */
  confirmedRevenue: number;
  /** Caparre già incassate. */
  depositsReceived: number;
  /** Saldo ancora da incassare sulle confermate (totale - caparra incassata). */
  outstanding: number;
  /** Numero prenotazioni confermate attive (in corso o future). */
  activeCount: number;
};

export type BoardAnalysis = {
  generatedAt: string;
  /** Azioni che richiedono attenzione (critical + warning). */
  actionsCount: number;
  insights: BoardInsight[];
  economics: BoardEconomics;
};

function isActiveStay(b: Booking): boolean {
  return b.status !== "cancelled" && b.status !== "blocked";
}

function fullName(b: Booking): string {
  return b.guestName?.trim() || "Ospite senza nome";
}

function guestProfileComplete(b: Booking): boolean {
  const p = b.guestProfile;
  if (!p) return false;
  return Boolean(
    p.surname && p.firstName && p.birthDate && p.documentType && p.documentNumber
  );
}

/**
 * Motore di analisi deterministico della booking board.
 * Nessun LLM: regole pratiche orientate alle azioni operative quotidiane.
 *
 * @param bookings  Prenotazioni canoniche (già riconciliate).
 * @param conflicts Conflitti rilevati dal reconciler (NON ricalcolati qui).
 * @param now       Data di riferimento (default: oggi).
 */
export function analyzeBoard(
  bookings: Booking[],
  conflicts: BookingConflict[],
  now: Date = new Date()
): BoardAnalysis {
  const insights: BoardInsight[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // --- 1) Conflitti / overbooking (riuso del reconciler, nessun ricalcolo) ---
  if (conflicts.length > 0) {
    insights.push({
      id: "conflitti",
      severity: "critical",
      category: "conflitti",
      title: `${conflicts.length} conflitto${conflicts.length > 1 ? "i" : ""} di sovrapposizione`,
      detail:
        "Due o più prenotazioni occupano lo stesso lodge nelle stesse date. Apri il pannello Overbooking in cima alla board per risolverli.",
      bookingIds: conflicts.flatMap((c) => [c.keptId, c.otherId]),
    });
  }

  // Pre-calcolo finestre temporali per le prenotazioni attive.
  const active = bookings.filter(isActiveStay);

  const arrivingSoon: Booking[] = [];
  const departingSoon: Booking[] = [];
  const missingDeposit: Booking[] = [];
  const optionsExpiring: Booking[] = [];
  const reportingDue: Booking[] = [];
  const syncFlagged: Booking[] = [];
  const newUnseen: Booking[] = [];

  let confirmedRevenue = 0;
  let depositsReceived = 0;
  let outstanding = 0;
  let activeCount = 0;

  for (const b of active) {
    const ci = parseISO(b.checkIn);
    const co = parseISO(b.checkOut);
    const daysToCheckIn = differenceInCalendarDays(ci, today);
    const daysToCheckOut = differenceInCalendarDays(co, today);
    const stayEnded = daysToCheckOut < 0;

    // Economia: solo confermate non ancora concluse.
    if (b.status === "confirmed" && !stayEnded) {
      activeCount++;
      confirmedRevenue += b.totalAmount || 0;
      const dep = b.depositReceived ? b.depositAmount || 0 : 0;
      depositsReceived += dep;
      outstanding += Math.max(0, (b.totalAmount || 0) - dep);
    }

    // Check-in imminenti (prossimi 7 giorni, non ancora arrivati).
    if (daysToCheckIn >= 0 && daysToCheckIn <= 7) arrivingSoon.push(b);

    // Check-out imminenti (oggi o domani) → pulizie/turnover.
    if (daysToCheckOut >= 0 && daysToCheckOut <= 1) departingSoon.push(b);

    // Caparra mancante su confermata con check-in entro 14 giorni.
    if (
      b.status === "confirmed" &&
      !b.depositReceived &&
      (b.depositAmount || 0) > 0 &&
      daysToCheckIn >= 0 &&
      daysToCheckIn <= 14
    ) {
      missingDeposit.push(b);
    }

    // Opzioni in scadenza: status "option" con check-in entro 10 giorni.
    if (b.status === "option" && daysToCheckIn >= 0 && daysToCheckIn <= 10) {
      optionsExpiring.push(b);
    }

    // Adempimenti Alloggiati/ROSS1000: arrivo entro 3 giorni o già arrivato e dati incompleti.
    if (
      (daysToCheckIn >= -1 && daysToCheckIn <= 3) &&
      b.reportingStatus !== "sent_alloggiati" &&
      b.reportingStatus !== "sent_ross1000" &&
      !guestProfileComplete(b)
    ) {
      reportingDue.push(b);
    }

    // Segnalazioni dal sync Airbnb (nota A-1).
    if ((b.notes ?? "").includes("⚠️ AIRBNB: date feed")) {
      syncFlagged.push(b);
    }

    // Nuove prenotazioni non ancora viste.
    if (b.isNew && !stayEnded) newUnseen.push(b);
  }

  const economics: BoardEconomics = {
    confirmedRevenue,
    depositsReceived,
    outstanding,
    activeCount,
  };

  // --- 2) Caparre mancanti ---
  if (missingDeposit.length > 0) {
    const totalMissing = missingDeposit.reduce((s, b) => s + (b.depositAmount || 0), 0);
    insights.push({
      id: "caparre",
      severity: "warning",
      category: "caparre",
      title: `${missingDeposit.length} caparr${missingDeposit.length > 1 ? "e" : "a"} da incassare`,
      detail:
        `Prenotazioni confermate con check-in vicino e caparra non ricevuta: ` +
        missingDeposit
          .slice(0, 6)
          .map((b) => `${fullName(b)} (${b.lodge})`)
          .join(", ") +
        (missingDeposit.length > 6 ? `, +${missingDeposit.length - 6}` : "") +
        ".",
      bookingIds: missingDeposit.map((b) => b.id),
      amount: totalMissing,
    });
  }

  // --- 3) Opzioni in scadenza ---
  if (optionsExpiring.length > 0) {
    insights.push({
      id: "opzioni",
      severity: "warning",
      category: "opzioni",
      title: `${optionsExpiring.length} opzione${optionsExpiring.length > 1 ? "i" : ""} da confermare`,
      detail:
        "Tenute in opzione con arrivo imminente: decidi se confermarle o liberare le date. " +
        optionsExpiring
          .slice(0, 6)
          .map((b) => `${fullName(b)} (${b.lodge})`)
          .join(", ") +
        ".",
      bookingIds: optionsExpiring.map((b) => b.id),
    });
  }

  // --- 4) Adempimenti ospiti ---
  if (reportingDue.length > 0) {
    insights.push({
      id: "adempimenti",
      severity: "warning",
      category: "adempimenti",
      title: `${reportingDue.length} pratic${reportingDue.length > 1 ? "he" : "a"} Alloggiati da preparare`,
      detail:
        "Ospiti in arrivo con anagrafica/documento incompleti: completa i dati per l'invio ad Alloggiati Web / ROSS1000. " +
        reportingDue
          .slice(0, 6)
          .map((b) => `${fullName(b)} (${b.lodge})`)
          .join(", ") +
        ".",
      bookingIds: reportingDue.map((b) => b.id),
    });
  }

  // --- 5) Check-in imminenti ---
  if (arrivingSoon.length > 0) {
    insights.push({
      id: "checkin",
      severity: "info",
      category: "checkin",
      title: `${arrivingSoon.length} arriv${arrivingSoon.length > 1 ? "i" : "o"} nei prossimi 7 giorni`,
      detail: arrivingSoon
        .slice(0, 8)
        .map((b) => `${fullName(b)} → ${b.lodge} dal ${b.checkIn}`)
        .join(" · "),
      bookingIds: arrivingSoon.map((b) => b.id),
    });
  }

  // --- 6) Check-out / turnover ---
  if (departingSoon.length > 0) {
    insights.push({
      id: "checkout",
      severity: "info",
      category: "checkout",
      title: `${departingSoon.length} partenz${departingSoon.length > 1 ? "e" : "a"} tra oggi e domani`,
      detail:
        "Programma le pulizie e il turnover: " +
        departingSoon.map((b) => `${b.lodge} (${fullName(b)})`).join(", ") +
        ".",
      bookingIds: departingSoon.map((b) => b.id),
    });
  }

  // --- 7) Segnalazioni sync Airbnb ---
  if (syncFlagged.length > 0) {
    insights.push({
      id: "sync",
      severity: "warning",
      category: "sync",
      title: `${syncFlagged.length} prenotazion${syncFlagged.length > 1 ? "i" : "e"} con date Airbnb da verificare`,
      detail:
        "Il sync Airbnb ha trovato date diverse rispetto al tuo inserimento manuale: controlla e allinea. " +
        syncFlagged.map((b) => `${fullName(b)} (${b.lodge})`).join(", ") +
        ".",
      bookingIds: syncFlagged.map((b) => b.id),
    });
  }

  // --- 8) Nuove prenotazioni ---
  if (newUnseen.length > 0) {
    insights.push({
      id: "nuove",
      severity: "info",
      category: "nuove",
      title: `${newUnseen.length} nuova${newUnseen.length > 1 ? "e prenotazioni" : " prenotazione"} da rivedere`,
      detail: newUnseen
        .slice(0, 8)
        .map((b) => `${fullName(b)} (${b.lodge})`)
        .join(", "),
      bookingIds: newUnseen.map((b) => b.id),
    });
  }

  // --- 9) Riepilogo economico (sempre presente) ---
  insights.push({
    id: "economia",
    severity: outstanding > 0 ? "info" : "success",
    category: "economia",
    title: "Riepilogo economico",
    detail:
      `${activeCount} prenotazioni confermate attive · ` +
      `valore ${eur(confirmedRevenue)} · ` +
      `caparre incassate ${eur(depositsReceived)} · ` +
      `saldo da incassare ${eur(outstanding)}.`,
    bookingIds: [],
    amount: outstanding,
  });

  // Tutto a posto?
  const actionsCount = insights.filter(
    (i) => i.severity === "critical" || i.severity === "warning"
  ).length;

  if (actionsCount === 0) {
    insights.unshift({
      id: "ok",
      severity: "success",
      category: "economia",
      title: "Nessuna azione urgente",
      detail:
        "Nessun conflitto, caparra o adempimento in sospeso. La board è in ordine — sotto trovi comunque il riepilogo e i promemoria.",
      bookingIds: [],
    });
  }

  return {
    generatedAt: now.toISOString(),
    actionsCount,
    insights,
    economics,
  };
}

function eur(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}
