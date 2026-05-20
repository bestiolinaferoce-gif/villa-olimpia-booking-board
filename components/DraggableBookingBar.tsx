"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { differenceInDays, parseISO } from "date-fns";
import type { Booking } from "@/lib/types";

type DraggableBookingBarProps = {
  booking: Booking;
  span: number;
  bg: string;
  text: string;
  isToday: boolean;
  isWeekend: boolean;
  isOverbooked: boolean;
  draggable: boolean;
  onEdit: (booking: Booking) => void;
};

export function DraggableBookingBar({
  booking,
  span,
  bg,
  text,
  isToday,
  isWeekend,
  isOverbooked,
  draggable,
  onEdit,
}: DraggableBookingBarProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `booking-${booking.id}`,
    disabled: !draggable,
    data: { booking },
  });

  const nights = differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
  const truncName = booking.guestName.length > 14
    ? booking.guestName.slice(0, 14) + "…"
    : booking.guestName;

  const className = [
    "gantt-cell",
    "gantt-cell-booked",
    isToday ? "gantt-cell-today" : "",
    isWeekend ? "gantt-cell-weekend" : "",
    isOverbooked ? "gantt-cell-overbooked" : "",
    draggable ? "gantt-cell-draggable" : "",
    isDragging ? "gantt-cell-dragging" : "",
  ].filter(Boolean).join(" ");

  const style: React.CSSProperties = {
    gridColumn: `span ${span}`,
    background: bg,
    color: text,
    borderLeft: `3px solid ${text}`,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    touchAction: draggable ? "none" : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      className={className}
      style={style}
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        onEdit(booking);
      }}
      title={`${booking.guestName}\n${booking.checkIn} → ${booking.checkOut}\n${booking.totalAmount}€${isOverbooked ? "\n⚠ Overbooking" : ""}`}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
    >
      <span className="gantt-cell-name">{truncName}</span>
      {span > 2 && <span className="gantt-cell-nights">{nights}n</span>}
      {span > 4 && <span className="gantt-cell-amount">{booking.totalAmount}€</span>}
      {booking.isNew && <span className="gantt-new-dot" />}
    </div>
  );
}
