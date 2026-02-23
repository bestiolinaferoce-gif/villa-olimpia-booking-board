"use client";

import { format, isSameDay, parseISO } from "date-fns";
import type { Booking, BookingFilters, Lodge } from "@/lib/types";
import { LODGES } from "@/lib/types";
import { isActiveOnDay, statusColors } from "@/lib/utils";

type BookingBoardProps = {
  monthDays: Date[];
  bookings: Booking[];
  filters: BookingFilters;
  onCreate: (lodge: Lodge, day: Date) => void;
  onEdit: (booking: Booking) => void;
};

function matchesFilters(booking: Booking, filters: BookingFilters): boolean {
  const search = filters.search.trim().toLowerCase();
  if (search && !booking.guestName.toLowerCase().includes(search)) {
    return false;
  }
  if (filters.status !== "all" && booking.status !== filters.status) {
    return false;
  }
  if (filters.channel !== "all" && booking.channel !== filters.channel) {
    return false;
  }
  if (!filters.showCancelled && booking.status === "cancelled") {
    return false;
  }
  return true;
}

export function BookingBoard({ monthDays, bookings, filters, onCreate, onEdit }: BookingBoardProps) {
  const visibleBookings = bookings.filter((booking) => matchesFilters(booking, filters));
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
            return (
              <tr key={day.toISOString()} className={isTodayRow ? "today-row" : ""}>
                <td className="sticky-col day-cell">
                  <div>{format(day, "dd MMM")}</div>
                  <small>{format(day, "EEE")}</small>
                </td>
                {LODGES.map((lodge) => {
                  const booking = visibleBookings.find(
                    (item) => item.lodge === lodge && isActiveOnDay(item, day),
                  );
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
                  const endsTomorrow = isSameDay(parseISO(booking.checkOut), day);
                  return (
                    <td key={`${lodge}-${day.toISOString()}`} onClick={() => onEdit(booking)}>
                      <div className="booking-chip" style={{ borderLeftColor: statusColors[booking.status] }}>
                        <strong>{booking.guestName}</strong>
                        <span>{booking.channel}</span>
                        {startsToday ? <em>Check-in</em> : null}
                        {endsTomorrow ? <em>Checkout domani</em> : null}
                      </div>
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
