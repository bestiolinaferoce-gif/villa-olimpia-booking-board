"use client";

import { addDays, format, isBefore, isSameDay, parseISO, startOfDay } from "date-fns";
import { useMemo } from "react";
import type { Booking, BookingFilters, Lodge } from "@/lib/types";
import { LODGES } from "@/lib/types";
import { bookingTooltip, channelBadge, channelLabels, matchesFilters, statusBadge, statusColors, statusLabels } from "@/lib/utils";

type BookingBoardProps = {
  monthDays: Date[];
  bookings: Booking[];
  filters: BookingFilters;
  onCreate: (lodge: Lodge, day: Date) => void;
  onEdit: (booking: Booking) => void;
};

export function BookingBoard({ monthDays, bookings, filters, onCreate, onEdit }: BookingBoardProps) {
  const visibleBookings = useMemo(
    () => bookings.filter((booking) => matchesFilters(booking, filters)),
    [bookings, filters],
  );

  // Pre-build lookup: "LodgeName::yyyy-MM-dd" → Booking
  // Parsa checkIn/checkOut di ogni prenotazione una sola volta,
  // eliminando il .find() + isActiveOnDay() ripetuto su ogni cella.
  const bookingIndex = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const booking of visibleBookings) {
      const checkIn = startOfDay(parseISO(booking.checkIn));
      const checkOut = startOfDay(parseISO(booking.checkOut));
      let cursor = checkIn;
      while (isBefore(cursor, checkOut)) {
        map.set(`${booking.lodge}::${format(cursor, "yyyy-MM-dd")}`, booking);
        cursor = addDays(cursor, 1);
      }
    }
    return map;
  }, [visibleBookings]);

  const today = new Date();

  return (
    <div className="board-wrap">
      <table className="booking-table">
        <thead>
          <tr>
            <th className="sticky-col">Giorno</th>
            {LODGES.map((lodge) => (
              <th key={lodge}>{lodge}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthDays.map((day) => {
            const isTodayRow = isSameDay(day, today);
            const dayKey = format(day, "yyyy-MM-dd");
            return (
              <tr key={day.toISOString()} className={isTodayRow ? "today-row" : ""}>
                <td className="sticky-col day-cell">
                  <div>{format(day, "dd MMM")}</div>
                  <small>{format(day, "EEE")}</small>
                </td>
                {LODGES.map((lodge) => {
                  const booking = bookingIndex.get(`${lodge}::${dayKey}`);
                  if (!booking) {
                    return (
                      <td key={`${lodge}-${day.toISOString()}`} className="empty-cell" onClick={() => onCreate(lodge, day)}>
                        <button type="button" className="cell-btn">
                          +
                        </button>
                      </td>
                    );
                  }
                  const startsToday = isSameDay(parseISO(booking.checkIn), day);
                  // "Checkout domani" si mostra sull'ultima notte attiva (checkOut - 1),
                  // non sul giorno di checkout stesso (che non è mai attivo per isActiveOnDay).
                  const checkoutTomorrow = isSameDay(addDays(parseISO(booking.checkOut), -1), day);
                  return (
                    <td key={`${lodge}-${day.toISOString()}`} onClick={() => onEdit(booking)}>
                      {(() => {
                        const sBadge = statusBadge[booking.status] ?? statusBadge.confirmed;
                        const cBadge = channelBadge[booking.channel] ?? channelBadge.other;
                        return (
                          <div className="booking-chip" data-status={booking.status} title={bookingTooltip(booking)} style={{ borderLeftColor: statusColors[booking.status] ?? statusColors.confirmed }}>
                            <strong>{booking.guestName} · {booking.guestsCount}p</strong>
                            <div className="chip-badges">
                              <span className="badge" style={{ background: sBadge.bg, color: sBadge.text, borderColor: sBadge.border }}>
                                {statusLabels[booking.status] ?? booking.status}
                              </span>
                              <span className="badge" style={{ background: cBadge.bg, color: cBadge.text, borderColor: cBadge.border }}>
                                {channelLabels[booking.channel] ?? booking.channel}
                              </span>
                            </div>
                            {startsToday ? <em>Check-in</em> : null}
                            {checkoutTomorrow ? <em>Checkout domani</em> : null}
                          </div>
                        );
                      })()}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
