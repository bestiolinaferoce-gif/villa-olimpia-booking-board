"use client";

import { differenceInDays, format, max, min, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import type { Booking } from "@/lib/types";
import type { BookingConflict } from "@/lib/reconciliation";
import { channelLabels, formatMoney } from "@/lib/utils";

type OverbookingPanelProps = {
  conflicts: BookingConflict[];
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
};

type EnrichedConflict = {
  conflict: BookingConflict;
  a: Booking;
  b: Booking;
  overlapStart: string;
  overlapEnd: string;
  overlapNights: number;
};

function enrichConflict(c: BookingConflict, bookings: Booking[]): EnrichedConflict | null {
  const a = bookings.find((x) => x.id === c.keptId);
  const b = bookings.find((x) => x.id === c.otherId);
  if (!a || !b) return null;
  const aIn = parseISO(a.checkIn);
  const aOut = parseISO(a.checkOut);
  const bIn = parseISO(b.checkIn);
  const bOut = parseISO(b.checkOut);
  const start = max([aIn, bIn]);
  const end = min([aOut, bOut]);
  const nights = Math.max(0, differenceInDays(end, start));
  return {
    conflict: c,
    a,
    b,
    overlapStart: format(start, "dd/MM/yyyy"),
    overlapEnd: format(end, "dd/MM/yyyy"),
    overlapNights: nights,
  };
}

function ConflictCard({ item, onOpenBooking }: { item: EnrichedConflict; onOpenBooking: (b: Booking) => void }) {
  const { conflict, a, b, overlapStart, overlapEnd, overlapNights } = item;
  const kindBadge =
    conflict.kind === "duplicate"
      ? { label: "Possibile duplicato", color: "#b45309", bg: "#fef3c7" }
      : { label: "Sovrapposizione", color: "#991b1b", bg: "#fee2e2" };

  return (
    <div className="overbooking-card">
      <div className="overbooking-card__head">
        <div className="overbooking-card__lodge">
          <strong>{conflict.lodge}</strong>
          <span
            className="overbooking-card__kind"
            style={{ background: kindBadge.bg, color: kindBadge.color }}
          >
            {kindBadge.label}
          </span>
        </div>
        <div className="overbooking-card__range">
          <strong>{overlapNights}</strong> {overlapNights === 1 ? "notte" : "notti"} sovrapposte
          <span className="overbooking-card__dates"> · {overlapStart} → {overlapEnd}</span>
        </div>
      </div>

      <div className="overbooking-card__guests">
        <button
          type="button"
          className="overbooking-card__guest"
          onClick={() => onOpenBooking(a)}
          title="Apri scheda prenotazione A"
        >
          <span className="overbooking-card__guest-name">{a.guestName}</span>
          <span className="overbooking-card__guest-meta">
            <span className="ob-chip ob-chip--ch">{channelLabels[a.channel] || a.channel}</span>
            {format(parseISO(a.checkIn), "dd/MM")} → {format(parseISO(a.checkOut), "dd/MM/yyyy")}
            {" · "}
            {formatMoney(a.totalAmount || 0)}
            {a.guestsCount ? ` · ${a.guestsCount} ospiti` : ""}
          </span>
          <span className="overbooking-card__open">Apri scheda →</span>
        </button>

        <div className="overbooking-card__vs">vs</div>

        <button
          type="button"
          className="overbooking-card__guest"
          onClick={() => onOpenBooking(b)}
          title="Apri scheda prenotazione B"
        >
          <span className="overbooking-card__guest-name">{b.guestName}</span>
          <span className="overbooking-card__guest-meta">
            <span className="ob-chip ob-chip--ch">{channelLabels[b.channel] || b.channel}</span>
            {format(parseISO(b.checkIn), "dd/MM")} → {format(parseISO(b.checkOut), "dd/MM/yyyy")}
            {" · "}
            {formatMoney(b.totalAmount || 0)}
            {b.guestsCount ? ` · ${b.guestsCount} ospiti` : ""}
          </span>
          <span className="overbooking-card__open">Apri scheda →</span>
        </button>
      </div>

      <p className="overbooking-card__hint">
        Suggerimento: apri una delle due schede e usa il drag&amp;drop sul calendario per spostarla su un lodge libero,
        oppure modifica date/lodge dal form.
      </p>
    </div>
  );
}

export function OverbookingPanel({ conflicts, bookings, onOpenBooking }: OverbookingPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const enriched = useMemo(
    () =>
      conflicts
        .map((c) => enrichConflict(c, bookings))
        .filter((x): x is EnrichedConflict => x !== null)
        // Mostra prima le sovrapposizioni vere, poi i duplicati. Dentro ogni gruppo ordina per data sovrapposizione.
        .sort((x, y) => {
          if (x.conflict.kind !== y.conflict.kind) return x.conflict.kind === "overlap" ? -1 : 1;
          return x.overlapStart.localeCompare(y.overlapStart);
        }),
    [conflicts, bookings]
  );

  if (enriched.length === 0) {
    return (
      <section className="overbooking-panel overbooking-panel--ok no-print" aria-live="polite">
        <div className="overbooking-panel__head">
          <span className="overbooking-panel__icon" aria-hidden="true">✓</span>
          <div>
            <h2 className="overbooking-panel__title">Nessun overbooking rilevato</h2>
            <p className="overbooking-panel__sub">Tutte le prenotazioni attive sono compatibili tra loro.</p>
          </div>
        </div>
      </section>
    );
  }

  const overlapCount = enriched.filter((x) => x.conflict.kind === "overlap").length;
  const dupCount = enriched.length - overlapCount;

  return (
    <section className="overbooking-panel overbooking-panel--alert no-print" aria-live="assertive">
      <div className="overbooking-panel__head">
        <span className="overbooking-panel__icon" aria-hidden="true">⚠</span>
        <div className="overbooking-panel__head-text">
          <h2 className="overbooking-panel__title">
            {enriched.length} {enriched.length === 1 ? "conflitto" : "conflitti"} da gestire
          </h2>
          <p className="overbooking-panel__sub">
            {overlapCount > 0 && (
              <>
                <strong>{overlapCount}</strong> sovrapposizion{overlapCount === 1 ? "e" : "i"} reale
                {overlapCount === 1 ? "" : "i"}
              </>
            )}
            {overlapCount > 0 && dupCount > 0 && " · "}
            {dupCount > 0 && (
              <>
                <strong>{dupCount}</strong> possibil{dupCount === 1 ? "e" : "i"} duplicat{dupCount === 1 ? "o" : "i"}
              </>
            )}
            {" · "}Apri le schede per spostare / correggere
          </p>
        </div>
        <button
          type="button"
          className="overbooking-panel__toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
        >
          {collapsed ? "Mostra dettagli" : "Nascondi dettagli"}
        </button>
      </div>

      {!collapsed && (
        <div className="overbooking-panel__list">
          {enriched.map((item) => (
            <ConflictCard
              key={`${item.conflict.keptId}::${item.conflict.otherId}`}
              item={item}
              onOpenBooking={onOpenBooking}
            />
          ))}
        </div>
      )}
    </section>
  );
}
