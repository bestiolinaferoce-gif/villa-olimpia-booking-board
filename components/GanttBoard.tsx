"use client";

import { addDays, differenceInDays, format, getDay, isSameDay, parseISO, startOfDay } from "date-fns";
import { useMemo } from "react";
import type { Booking, BookingFilters, Lodge } from "@/lib/types";
import { LODGES } from "@/lib/types";
import { bookingTooltip, channelBadge, formatMoney, matchesFilters, statusColors } from "@/lib/utils";

const LODGE_COLORS: Record<Lodge, { bg: string; text: string; dot: string }> = {
  Frangipane: { bg: "#f5f3ff", text: "#5b21b6", dot: "#8b5cf6" },
  Fiordaliso: { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
  Giglio: { bg: "#f0fdf4", text: "#065f46", dot: "#10b981" },
  Tulipano: { bg: "#fff1f2", text: "#9f1239", dot: "#f43f5e" },
  Orchidea: { bg: "#fdf2f8", text: "#9d174d", dot: "#ec4899" },
  Lavanda: { bg: "#f5f3ff", text: "#4c1d95", dot: "#a78bfa" },
  Geranio: { bg: "#fff7ed", text: "#9a3412", dot: "#f97316" },
  Gardenia: { bg: "#f0fdfa", text: "#134e4a", dot: "#14b8a6" },
  Azalea: { bg: "#fff1f2", text: "#881337", dot: "#e11d48" },
};

type GanttBoardProps = {
  monthDays: Date[];
  bookings: Booking[];
  filters: BookingFilters;
  onCreate: (lodge: Lodge, day: Date) => void;
  onEdit: (booking: Booking) => void;
};

export function GanttBoard({ monthDays, bookings, filters, onCreate, onEdit }: GanttBoardProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayIndex = useMemo(() => monthDays.findIndex((d) => isSameDay(d, today)), [monthDays, today]);

  const visibleBookings = useMemo(
    () => bookings.filter((b) => matchesFilters(b, filters)),
    [bookings, filters]
  );

  const lodgeRows = useMemo(() => {
    const firstDay = monthDays[0] ? startOfDay(monthDays[0]) : today;
    const lastDay = monthDays[monthDays.length - 1] ? startOfDay(monthDays[monthDays.length - 1]) : today;

    return LODGES.map((lodge) => {
      const lodgeBookings = visibleBookings.filter(
        (b) => b.lodge === lodge && b.status !== "cancelled"
      );
      const bars = lodgeBookings
        .map((booking) => {
          const checkIn = startOfDay(parseISO(booking.checkIn));
          const checkOut = startOfDay(parseISO(booking.checkOut));
          const barStart = checkIn < firstDay ? firstDay : checkIn;
          const barEnd =
            checkOut > addDays(lastDay, 1) ? addDays(lastDay, 1) : checkOut;

          const startCol = differenceInDays(barStart, firstDay);
          const spanCols = differenceInDays(barEnd, barStart);
          const totalNights = differenceInDays(checkOut, checkIn);

          return { booking, startCol, spanCols, totalNights };
        })
        .filter((b) => b.spanCols > 0);

      return { lodge, bars };
    });
  }, [visibleBookings, monthDays, today]);

  const gridCols = `180px repeat(${monthDays.length}, minmax(36px, 1fr))`;
  const dayCols = `repeat(${monthDays.length}, minmax(36px, 1fr))`;

  return (
    <div className="gantt-wrap">
      <div
        className="gantt-header"
        style={{ display: "grid", gridTemplateColumns: gridCols }}
      >
        <div className="gantt-header-label">Lodge</div>
        {monthDays.map((day, i) => {
          const isToday = isSameDay(day, today);
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;
          return (
            <div
              key={i}
              className={[
                "gantt-day-header",
                isToday && "gantt-day-today",
                isWeekend && "gantt-day-weekend",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="gantt-day-num">{format(day, "d")}</span>
              <span className="gantt-day-name">{format(day, "EEE")}</span>
            </div>
          );
        })}
      </div>

      <div className="gantt-body">
        {lodgeRows.map(({ lodge, bars }) => {
          const lc = LODGE_COLORS[lodge];
          return (
            <div
              key={lodge}
              className="gantt-row"
              style={{ display: "grid", gridTemplateColumns: gridCols }}
            >
              <div
                className="gantt-lodge-label"
                style={{ background: lc.bg, color: lc.text }}
              >
                <span className="gantt-lodge-dot" style={{ background: lc.dot }} />
                <span className="gantt-lodge-name">{lodge}</span>
              </div>
              <div
                className="gantt-cells-area"
                style={{
                  display: "grid",
                  gridTemplateColumns: dayCols,
                  position: "relative",
                }}
              >
                {monthDays.map((day, i) => {
                  const isToday = isSameDay(day, today);
                  const isWeekend = getDay(day) === 0 || getDay(day) === 6;
                  const hasBooking = bars.some(
                    (b) => i >= b.startCol && i < b.startCol + b.spanCols
                  );
                  return (
                    <div
                      key={i}
                      className={[
                        "gantt-cell",
                        isToday && "gantt-cell-today",
                        isWeekend && "gantt-cell-weekend",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{ gridColumn: i + 1 }}
                      onClick={!hasBooking ? () => onCreate(lodge, day) : undefined}
                    >
                      {!hasBooking && <span className="gantt-add-btn">+</span>}
                    </div>
                  );
                })}

                {bars.map(({ booking, startCol, spanCols, totalNights }) => {
                  const statusColor = statusColors[booking.status] ?? statusColors.confirmed;
                  const cBadge = channelBadge[booking.channel] ?? channelBadge.direct;
                  const colCount = monthDays.length;
                  const leftPct = (startCol / colCount) * 100;
                  const widthPct = (spanCols / colCount) * 100;
                  return (
                    <div
                      key={booking.id}
                      className="gantt-bar"
                      title={bookingTooltip(booking)}
                      onClick={() => onEdit(booking)}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        borderLeftColor: statusColor,
                        background: `linear-gradient(135deg, ${statusColor}22 0%, ${statusColor}15 100%)`,
                        borderTop: `1px solid ${statusColor}44`,
                        borderRight: `1px solid ${statusColor}22`,
                        borderBottom: `1px solid ${statusColor}22`,
                      }}
                    >
                      <div className="gantt-bar-inner">
                        <span className="gantt-bar-name">{booking.guestName}</span>
                        {spanCols > 3 && (
                          <span className="gantt-bar-meta">
                            {totalNights}n · {formatMoney(booking.totalAmount)}
                            {booking.depositReceived
                              ? " ✓"
                              : booking.depositAmount > 0
                              ? " ⚠"
                              : ""}
                          </span>
                        )}
                        {spanCols > 5 && (
                          <span
                            className="gantt-bar-channel"
                            style={{ background: cBadge.bg, color: cBadge.text }}
                          >
                            {booking.channel}
                          </span>
                        )}
                      </div>
                      {booking.isNew && (
                        <span className="gantt-bar-new-badge">NUOVO</span>
                      )}
                    </div>
                  );
                })}

                {todayIndex >= 0 && (
                  <div
                    className="gantt-today-line"
                    style={{
                      left: `${(todayIndex / monthDays.length) * 100}%`,
                      width: `${(1 / monthDays.length) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
