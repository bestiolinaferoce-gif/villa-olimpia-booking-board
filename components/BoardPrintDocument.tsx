"use client";

import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { Booking, GuestProfile } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const STRUCTURE_LINE = "Villa Olimpia — La Caletta";

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
};

export function BoardPrintDocument({ bookings, monthLabel, generatedAtLabel }: Props) {
  return (
    <div className="board-print-document" aria-hidden>
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

            <section className="board-print-block">
              <h2>Dati cliente</h2>
              <table className="board-print-table">
                <tbody>
                  <tr>
                    <th>Nome e cognome</th>
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
                    <th>Residenza</th>
                    <td>{disp(p?.residence)}</td>
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

            <section className="board-print-block">
              <h2>Prenotazione</h2>
              <table className="board-print-table">
                <tbody>
                  <tr>
                    <th>Struttura</th>
                    <td>{STRUCTURE_LINE}</td>
                  </tr>
                  <tr>
                    <th>Lodge / appartamento</th>
                    <td>{b.lodge}</td>
                  </tr>
                  <tr>
                    <th>Check-in</th>
                    <td>{fmtDate(b.checkIn)}</td>
                  </tr>
                  <tr>
                    <th>Check-out</th>
                    <td>{fmtDate(b.checkOut)}</td>
                  </tr>
                  <tr>
                    <th>Numero ospiti</th>
                    <td>{b.guestsCount}</td>
                  </tr>
                  <tr>
                    <th>Presenza animali</th>
                    <td>{petsFromNotes(b.notes)}</td>
                  </tr>
                  <tr>
                    <th>Stato / canale</th>
                    <td>
                      {b.status} · {b.channel}
                    </td>
                  </tr>
                  <tr>
                    <th>ID prenotazione</th>
                    <td>{b.id}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="board-print-block">
              <h2>Riepilogo economico</h2>
              <table className="board-print-table">
                <tbody>
                  <tr>
                    <th>Importo soggiorno (totale prenotazione)</th>
                    <td>{formatMoney(b.totalAmount)}</td>
                  </tr>
                  <tr>
                    <th>Extra e oneri</th>
                    <td>Non distinti nella scheda (registrare nelle note se necessario)</td>
                  </tr>
                  <tr>
                    <th>Tassa di soggiorno</th>
                    <td>Non gestita separatamente nella board</td>
                  </tr>
                  <tr>
                    <th>Totale</th>
                    <td>
                      <strong>{formatMoney(b.totalAmount)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <th>Acconto / caparra</th>
                    <td>
                      {formatMoney(b.depositAmount)}
                      {b.depositReceived ? " (ricevuta)" : " (non segnata come ricevuta)"}
                    </td>
                  </tr>
                  <tr>
                    <th>Saldo da incassare</th>
                    <td>
                      <strong>{formatMoney(saldo)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            {b.notes.trim() ? (
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
