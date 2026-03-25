"use client";

import { differenceInDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Booking, GuestProfile } from "@/lib/types";
import { PRINT_SECTIONS_FULL, type PrintSections } from "@/lib/printConfig";
import { channelLabels, formatMoney, statusLabels } from "@/lib/utils";

const STRUCTURE_LINE = "Villa Olimpia";

const DOC_LABELS: Partial<Record<NonNullable<GuestProfile["documentType"]>, string>> = {
  CARTA_IDENTITA: "Carta d'identità",
  PASSAPORTO: "Passaporto",
  PATENTE: "Patente",
  PERMESSO_SOGGIORNO: "Permesso di soggiorno",
};

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: it });
  } catch {
    return iso || "—";
  }
}

function disp(v: string | undefined | null): string {
  const s = v?.trim();
  return s ? s : "—";
}

function dispMoney(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return formatMoney(n);
}

function petsFromNotes(notes: string): string {
  if (!notes.trim()) return "Non indicato nelle note";
  if (/\b(animale|animali|cane|cani|gatto|gatti|pet)\b/i.test(notes)) return "Indicato nelle note";
  return "Non indicato nelle note";
}

function docLine(p: GuestProfile | undefined): string {
  if (!p?.documentType || !p.documentNumber?.trim()) return "—";
  const label = (p.documentType && DOC_LABELS[p.documentType]) || p.documentType;
  const parts = [label, p.documentNumber.trim()];
  if (p.documentIssuePlace?.trim()) parts.push(`ril. ${p.documentIssuePlace.trim()}`);
  if (p.documentIssueDate) parts.push(fmtDate(p.documentIssueDate));
  return parts.join(" · ");
}

type Props = {
  bookings: Booking[];
  monthLabel: string;
  generatedAtLabel: string;
  /** Se assente, comportamento = scheda completa (retrocompatibile). */
  sections?: PrintSections;
};

export function BoardPrintDocument({
  bookings,
  monthLabel,
  generatedAtLabel,
  sections: sectionsProp,
}: Props) {
  const sec: PrintSections = sectionsProp ?? PRINT_SECTIONS_FULL;

  const showEconomicoBlock =
    sec.totalePrenotazione ||
    sec.riepilogoEconomicoDettagliato ||
    sec.caparra ||
    sec.saldo;

  return (
    <div className="board-print-document">
      <div className="board-print-meta">
        <p>
          <strong>Filtro vista:</strong> {monthLabel} · <strong>Generato:</strong> {generatedAtLabel}
        </p>
        <p>
          <strong>Prenotazioni incluse:</strong> {bookings.length}
        </p>
      </div>

      {bookings.map((b, idx) => {
        const p = b.guestProfile;
        const displayName =
          p?.surname || p?.firstName
            ? [p?.firstName, p?.surname].filter(Boolean).join(" ").trim() || b.guestName
            : b.guestName;
        const saldo = Math.max(
          0,
          b.totalAmount - (b.depositReceived ? b.depositAmount : 0)
        );
        let nights = 0;
        try {
          nights = differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn));
        } catch {
          nights = 0;
        }

        const showGuestSummaryRow = !sec.anagraficaCompleta && (sec.datiSoggiorno || sec.dettaglioPrenotazione);

        return (
          <article
            key={b.id}
            className="board-print-sheet"
            style={idx < bookings.length - 1 ? { pageBreakAfter: "always" } : undefined}
          >
            <header className="board-print-header">
              <h1>{STRUCTURE_LINE}</h1>
              <p className="board-print-sub">Scheda prenotazione / Ospite</p>
            </header>

            {sec.anagraficaCompleta ? (
              <section className="board-print-block">
                <h2>Dati cliente</h2>
                <table className="board-print-table">
                  <tbody>
                    <tr>
                      <th>Nome (anagrafica)</th>
                      <td>{disp(p?.firstName)}</td>
                    </tr>
                    <tr>
                      <th>Cognome (anagrafica)</th>
                      <td>{disp(p?.surname)}</td>
                    </tr>
                    <tr>
                      <th>Nome completo (scheda)</th>
                      <td>{disp(displayName)}</td>
                    </tr>
                    <tr>
                      <th>Codice fiscale</th>
                      <td>{disp(p?.fiscalCode)}</td>
                    </tr>
                    <tr>
                      <th>Documento identità</th>
                      <td>{docLine(p)}</td>
                    </tr>
                    <tr>
                      <th>Indirizzo / residenza</th>
                      <td>{disp(p?.residence)}</td>
                    </tr>
                    <tr>
                      <th>Città</th>
                      <td>{disp(p?.residenceCity)}</td>
                    </tr>
                    <tr>
                      <th>Provincia</th>
                      <td>{disp(p?.residenceProvince)}</td>
                    </tr>
                    <tr>
                      <th>CAP</th>
                      <td>{disp(p?.residencePostalCode)}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{disp(p?.email)}</td>
                    </tr>
                    <tr>
                      <th>Telefono</th>
                      <td>{disp(p?.phone)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            ) : null}

            {(sec.dettaglioPrenotazione || sec.datiSoggiorno) && (
              <section className="board-print-block">
                <h2>Prenotazione</h2>
                <table className="board-print-table">
                  <tbody>
                    {showGuestSummaryRow ? (
                      <tr>
                        <th>Ospite</th>
                        <td>{disp(displayName)}</td>
                      </tr>
                    ) : null}
                    {sec.dettaglioPrenotazione ? (
                      <tr>
                        <th>Struttura</th>
                        <td>{STRUCTURE_LINE}</td>
                      </tr>
                    ) : null}
                    {sec.dettaglioPrenotazione ? (
                      <tr>
                        <th>Lodge / appartamento</th>
                        <td>{b.lodge}</td>
                      </tr>
                    ) : null}
                    {sec.datiSoggiorno ? (
                      <tr>
                        <th>Check-in</th>
                        <td>{fmtDate(b.checkIn)}</td>
                      </tr>
                    ) : null}
                    {sec.datiSoggiorno ? (
                      <tr>
                        <th>Check-out</th>
                        <td>{fmtDate(b.checkOut)}</td>
                      </tr>
                    ) : null}
                    {sec.datiSoggiorno ? (
                      <tr>
                        <th>Notti</th>
                        <td>{nights > 0 ? String(nights) : "—"}</td>
                      </tr>
                    ) : null}
                    {sec.datiSoggiorno ? (
                      <tr>
                        <th>Numero ospiti</th>
                        <td>{b.guestsCount}</td>
                      </tr>
                    ) : null}
                    {sec.datiSoggiorno ? (
                      <tr>
                        <th>Bambini</th>
                        <td>{b.childrenCount !== undefined ? String(b.childrenCount) : "—"}</td>
                      </tr>
                    ) : null}
                    {sec.datiSoggiorno ? (
                      <tr>
                        <th>Presenza animali</th>
                        <td>{petsFromNotes(b.notes)}</td>
                      </tr>
                    ) : null}
                    {sec.dettaglioPrenotazione ? (
                      <tr>
                        <th>Fonte / canale</th>
                        <td>{channelLabels[b.channel] ?? b.channel}</td>
                      </tr>
                    ) : null}
                    {sec.dettaglioPrenotazione ? (
                      <tr>
                        <th>Stato prenotazione</th>
                        <td>{statusLabels[b.status] ?? b.status}</td>
                      </tr>
                    ) : null}
                    {sec.dettaglioPrenotazione ? (
                      <tr>
                        <th>ID prenotazione</th>
                        <td>{b.id}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
            )}

            {showEconomicoBlock ? (
              <section className="board-print-block">
                <h2>Riepilogo economico</h2>
                <table className="board-print-table">
                  <tbody>
                    {sec.totalePrenotazione ? (
                      <tr>
                        <th>Totale prenotazione (importo principale)</th>
                        <td>{formatMoney(b.totalAmount)}</td>
                      </tr>
                    ) : null}
                    {sec.riepilogoEconomicoDettagliato ? (
                      <>
                        <tr>
                          <th>Extra</th>
                          <td>{dispMoney(b.extrasAmount)}</td>
                        </tr>
                        <tr>
                          <th>Quota pulizie / servizi</th>
                          <td>{dispMoney(b.cleaningFee)}</td>
                        </tr>
                        <tr>
                          <th>Tassa di soggiorno</th>
                          <td>{dispMoney(b.touristTax)}</td>
                        </tr>
                        <tr>
                          <th>Totale soggiorno (totale scheda)</th>
                          <td>
                            <strong>{formatMoney(b.totalAmount)}</strong>
                          </td>
                        </tr>
                        <tr>
                          <th>Note economiche</th>
                          <td>{b.economicNotes?.trim() ? b.economicNotes.trim() : "—"}</td>
                        </tr>
                      </>
                    ) : null}
                    {sec.caparra ? (
                      <tr>
                        <th>Acconto / caparra</th>
                        <td>
                          {formatMoney(b.depositAmount)}
                          {b.depositReceived ? " (ricevuta)" : " (non segnata come ricevuta)"}
                        </td>
                      </tr>
                    ) : null}
                    {sec.saldo ? (
                      <tr>
                        <th>Saldo residuo</th>
                        <td>
                          <strong>{formatMoney(saldo)}</strong>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
            ) : null}

            {sec.note && b.notes.trim() ? (
              <section className="board-print-block">
                <h2>Note</h2>
                <p className="board-print-notes">{b.notes.trim()}</p>
              </section>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
