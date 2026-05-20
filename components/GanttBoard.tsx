"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  addDays,
  differenceInDays,
  format,
  getDay,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";
import { Briefcase, Calendar as CalendarIcon, PartyPopper } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DraggableBookingBar } from "@/components/DraggableBookingBar";
import { useBookingStore } from "@/lib/store";
import { computeDropState, detectOverbooking, type DropState } from "@/lib/dnd-helpers";
import { EVENT_TYPE_LABELS, LODGES, type Booking, type BookingFilters, type EventType, type Lodge } from "@/lib/types";

const CHANNEL_BAR_COLORS: Record<string, { bg: string; text: string }> = {
  airbnb: { bg: "#fda4af", text: "#9f1239" },
  direct: { bg: "#6ee7b7", text: "#065f46" },
  booking: { bg: "#93c5fd", text: "#1e3a8a" },
  expedia: { bg: "#fcd34d", text: "#78350f" },
  other: { bg: "#d1d5db", text: "#374151" },
};

const STATUS_BAR_OVERRIDES: Partial<Record<string, { bg: string; text: string }>> = {
  option: { bg: "#fcd34d", text: "#78350f" },
  blocked: { bg: "#e5e7eb", text: "#6b7280" },
  cancelled: { bg: "#e5e7eb", text: "#9ca3af" },
};

function barColors(channel: string, status: string): { bg: string; text: string } {
  return (
    STATUS_BAR_OVERRIDES[status] ??
    CHANNEL_BAR_COLORS[channel] ??
    CHANNEL_BAR_COLORS.other
  );
}

const LODGE_COLORS: Record<Lodge, { dot: string }> = {
  Frangipane: { dot: "#8b5cf6" },
  Fiordaliso: { dot: "#3b82f6" },
  Giglio: { dot: "#10b981" },
  Tulipano: { dot: "#f43f5e" },
  Orchidea: { dot: "#ec4899" },
  Lavanda: { dot: "#a78bfa" },
  Geranio: { dot: "#f97316" },
  Gardenia: { dot: "#14b8a6" },
  Azalea: { dot: "#e11d48" },
};

const MIDDLE_LODGE_INDEX = Math.floor(LODGES.length / 2);

function eventIcon(t?: EventType) {
  switch (t) {
    case "corporate":
      return <Briefcase size={14} />;
    case "other":
      return <CalendarIcon size={14} />;
    default:
      return <PartyPopper size={14} />;
  }
}

type CellInfo = { booking: Booking; isFirst: boolean; span: number };

function bookingOccupiesLodge(b: Booking, lodge: Lodge): boolean {
  const type = b.bookingType ?? "single_lodge";
  if (type === "event") return true;
  return b.lodge === lodge;
}

function buildCellMap(
  lodge: Lodge,
  bookings: Booking[],
  monthDays: Date[],
): Map<number, CellInfo> {
  const firstDay = startOfDay(monthDays[0]);
  const lastDay = startOfDay(monthDays[monthDays.length - 1]);
  const map = new Map<number, CellInfo>();

  const lodgeBookings = bookings.filter(
    (b) => b.status !== "cancelled" && bookingOccupiesLodge(b, lodge),
  );

  for (const booking of lodgeBookings) {
    const checkIn = startOfDay(parseISO(booking.checkIn));
    const checkOut = startOfDay(parseISO(booking.checkOut));
    const barStart = checkIn < firstDay ? firstDay : checkIn;
    const barEnd = checkOut > addDays(lastDay, 1) ? addDays(lastDay, 1) : checkOut;
    const startIdx = differenceInDays(barStart, firstDay);
    const span = differenceInDays(barEnd, barStart);

    for (let i = startIdx; i < startIdx + span && i < monthDays.length; i++) {
      if (i >= 0) {
        map.set(i, {
          booking,
          isFirst: i === startIdx,
          span: i === startIdx ? span : 0,
        });
      }
    }
  }
  return map;
}

type GanttBoardProps = {
  monthDays: Date[];
  bookings: Booking[];
  filters: BookingFilters;
  onCreate: (lodge: Lodge, day: Date) => void;
  onEdit: (booking: Booking) => void;
};

type DroppableRowProps = {
  lodge: Lodge;
  lodgeIdx: number;
  monthDays: Date[];
  cellMap: Map<number, CellInfo>;
  today: Date;
  overbookingMap: Map<string, Booking[]>;
  dropState: DropState | null;
  onCreate: (lodge: Lodge, day: Date) => void;
  onEdit: (booking: Booking) => void;
  gridCols: string;
};

function DroppableRow({
  lodge,
  lodgeIdx,
  monthDays,
  cellMap,
  today,
  overbookingMap,
  dropState,
  onCreate,
  onEdit,
  gridCols,
}: DroppableRowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `lodge-${lodge}` });

  const rowClass = [
    "gantt-row",
    isOver && dropState === "valid" ? "gantt-row--drop-valid" : "",
    isOver && dropState === "invalid" ? "gantt-row--drop-invalid" : "",
    isOver && dropState === "swap" ? "gantt-row--drop-swap" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={setNodeRef}
      className={rowClass}
      style={{
        display: "grid",
        gridTemplateColumns: gridCols,
        minWidth: 0,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div className="gantt-lodge-label">
        <span className="gantt-dot" style={{ background: LODGE_COLORS[lodge].dot }} />
        {lodge}
      </div>
      {renderLodgeCells(lodge, lodgeIdx, cellMap, monthDays, today, overbookingMap, onCreate, onEdit)}
    </div>
  );
}

function renderLodgeCells(
  lodge: Lodge,
  lodgeIdx: number,
  cellMap: Map<number, CellInfo>,
  monthDays: Date[],
  today: Date,
  overbookingMap: Map<string, Booking[]>,
  onCreate: (lodge: Lodge, day: Date) => void,
  onEdit: (booking: Booking) => void,
) {
  const cells: React.ReactNode[] = [];
  let i = 0;
  while (i < monthDays.length) {
    const info = cellMap.get(i);
    if (!info) {
      const isToday = isSameDay(monthDays[i], today);
      const isWeekend = getDay(monthDays[i]) === 0 || getDay(monthDays[i]) === 6;
      cells.push(
        <div
          key={i}
          className={`gantt-cell gantt-cell-empty${isToday ? " gantt-cell-today" : ""}${isWeekend ? " gantt-cell-weekend" : ""}`}
          onClick={() => onCreate(lodge, monthDays[i])}
        >
          <span className="gantt-add">+</span>
        </div>,
      );
      i++;
    } else if (info.isFirst) {
      const { booking, span } = info;
      const isToday = isSameDay(monthDays[i], today);
      const isWeekend = getDay(monthDays[i]) === 0 || getDay(monthDays[i]) === 6;
      const isOverbooked = overbookingMap.has(booking.id);
      const type = booking.bookingType ?? "single_lodge";

      if (type === "whole_villa") {
        const showLabel = lodgeIdx === MIDDLE_LODGE_INDEX;
        cells.push(
          <div
            key={i}
            className={`gantt-cell gantt-whole-villa-bar${isToday ? " gantt-cell-today" : ""}${isWeekend ? " gantt-cell-weekend" : ""}`}
            style={{ gridColumn: `span ${span}` }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(booking);
            }}
            title={`Villa Intera — ${booking.guestName}\n${booking.checkIn} → ${booking.checkOut}`}
          >
            {showLabel && <span>★ Villa Intera · {booking.guestName}</span>}
          </div>,
        );
      } else if (type === "event") {
        const showLabel = lodgeIdx === MIDDLE_LODGE_INDEX;
        const evLabel = booking.eventType ? EVENT_TYPE_LABELS[booking.eventType] : "Evento";
        cells.push(
          <div
            key={i}
            className={`gantt-cell gantt-event-bar${isToday ? " gantt-cell-today" : ""}${isWeekend ? " gantt-cell-weekend" : ""}`}
            style={{ gridColumn: `span ${span}` }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(booking);
            }}
            title={`Evento (${evLabel}) — ${booking.guestName}\n${booking.checkIn} → ${booking.checkOut}`}
          >
            <span className="gantt-event-icon">{eventIcon(booking.eventType)}</span>
            {showLabel && <span>{evLabel} · {booking.guestName}</span>}
          </div>,
        );
      } else {
        const bc = barColors(booking.channel, booking.status);
        cells.push(
          <DraggableBookingBar
            key={i}
            booking={booking}
            span={span}
            bg={bc.bg}
            text={bc.text}
            isToday={isToday}
            isWeekend={isWeekend}
            isOverbooked={isOverbooked}
            draggable={true}
            onEdit={onEdit}
          />,
        );
      }
      i += span;
    } else {
      i++;
    }
  }
  return cells;
}

export function GanttBoard({
  monthDays,
  bookings,
  filters,
  onCreate,
  onEdit,
}: GanttBoardProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const updateBooking = useBookingStore((s) => s.updateBooking);
  const showToast = useBookingStore((s) => s.showToast);

  const visibleBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (filters.search.trim()) {
          if (!b.guestName.toLowerCase().includes(filters.search.trim().toLowerCase())) return false;
        }
        if (filters.status !== "all" && b.status !== filters.status) return false;
        if (filters.channel !== "all" && b.channel !== filters.channel) return false;
        if (!filters.showCancelled && b.status === "cancelled") return false;
        return true;
      }),
    [bookings, filters],
  );

  const overbookingMap = useMemo(() => detectOverbooking(visibleBookings), [visibleBookings]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [overLodge, setOverLodge] = useState<Lodge | null>(null);
  const [pendingSwap, setPendingSwap] = useState<{ a: Booking; b: Booking; targetLodge: Lodge } | null>(null);

  const dropState: DropState | null = useMemo(() => {
    if (!activeBooking || !overLodge) return null;
    return computeDropState(activeBooking, overLodge, bookings);
  }, [activeBooking, overLodge, bookings]);

  function handleDragStart(e: DragStartEvent) {
    const b = e.active.data.current?.booking as Booking | undefined;
    if (b) setActiveBooking(b);
  }

  function handleDragOver(e: DragOverEvent) {
    const overId = e.over?.id;
    if (typeof overId === "string" && overId.startsWith("lodge-")) {
      setOverLodge(overId.slice("lodge-".length) as Lodge);
    } else {
      setOverLodge(null);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const overId = e.over?.id;
    const target = typeof overId === "string" && overId.startsWith("lodge-")
      ? (overId.slice("lodge-".length) as Lodge)
      : null;
    const active = activeBooking;
    setActiveBooking(null);
    setOverLodge(null);

    if (!active || !target || target === active.lodge) return;
    const state = computeDropState(active, target, bookings);
    if (state === "invalid") {
      showToast(`Sovrapposizione su ${target}: impossibile spostare.`, "error", 5000);
      return;
    }
    if (state === "swap") {
      const other = bookings.find(
        (b) =>
          b.id !== active.id &&
          b.lodge === target &&
          b.status !== "cancelled" &&
          (b.bookingType ?? "single_lodge") === "single_lodge",
      );
      if (other) {
        setPendingSwap({ a: active, b: other, targetLodge: target });
        return;
      }
    }
    moveBooking(active, target);
  }

  function moveBooking(b: Booking, targetLodge: Lodge) {
    try {
      updateBooking(b.id, {
        guestName: b.guestName,
        lodge: targetLodge,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
        channel: b.channel,
        notes: b.notes,
        guestsCount: b.guestsCount,
        totalAmount: b.totalAmount,
        depositAmount: b.depositAmount,
        depositReceived: b.depositReceived,
        guestProfile: b.guestProfile,
        extrasAmount: b.extrasAmount,
        cleaningFee: b.cleaningFee,
        touristTax: b.touristTax,
        childrenCount: b.childrenCount,
        economicNotes: b.economicNotes,
        dataOrigin: b.dataOrigin,
        reportingStatus: b.reportingStatus,
        reportingNotes: b.reportingNotes,
        bookingType: b.bookingType,
        eventType: b.eventType,
        wholeVillaGroupId: b.wholeVillaGroupId,
      });
      showToast(`✓ ${b.guestName} spostato su ${targetLodge}.`, "success", 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore.";
      showToast(msg, "error", 5000);
    }
  }

  function confirmSwap() {
    if (!pendingSwap) return;
    const { a, b, targetLodge } = pendingSwap;
    const originLodge = a.lodge;
    try {
      moveBooking(a, targetLodge);
      moveBooking(b, originLodge);
      showToast(`✓ Scambio completato: ${a.guestName} ↔ ${b.guestName}.`, "success", 3500);
    } finally {
      setPendingSwap(null);
    }
  }

  const daysCount = monthDays.length;
  const gridCols = `180px repeat(${daysCount}, minmax(32px, 1fr))`;

  return (
    <>
      <DndContext
        sensors={sensors}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="gantt-wrap no-print" style={{ overflowX: "auto" }}>
          <div
            className="gantt-header"
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              minWidth: 0,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div className="gantt-label-col">Lodge</div>
            {monthDays.map((day, i) => {
              const isToday = isSameDay(day, today);
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;
              return (
                <div
                  key={i}
                  className={`gantt-day-header ${isToday ? "gantt-today-header" : ""} ${isWeekend ? "gantt-weekend-header" : ""}`}
                >
                  <span className="gantt-day-num">{format(day, "d")}</span>
                  <span className="gantt-day-name">{format(day, "EEE")}</span>
                </div>
              );
            })}
          </div>

          {LODGES.map((lodge, lodgeIdx) => {
            const cellMap = buildCellMap(lodge, visibleBookings, monthDays);
            return (
              <DroppableRow
                key={lodge}
                lodge={lodge}
                lodgeIdx={lodgeIdx}
                monthDays={monthDays}
                cellMap={cellMap}
                today={today}
                overbookingMap={overbookingMap}
                dropState={overLodge === lodge ? dropState : null}
                onCreate={onCreate}
                onEdit={onEdit}
                gridCols={gridCols}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeBooking ? (
            <div
              className="gantt-cell gantt-cell-booked gantt-cell-dragging"
              style={{
                background: barColors(activeBooking.channel, activeBooking.status).bg,
                color: barColors(activeBooking.channel, activeBooking.status).text,
                borderLeft: `3px solid ${barColors(activeBooking.channel, activeBooking.status).text}`,
                padding: "0 8px",
                borderRadius: 6,
                opacity: 0.9,
                boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
              }}
            >
              <span>{activeBooking.guestName}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <ConfirmDialog
        open={!!pendingSwap}
        title="Scambia prenotazioni"
        message={pendingSwap
          ? `${pendingSwap.a.guestName} → ${pendingSwap.targetLodge}\n${pendingSwap.b.guestName} → ${pendingSwap.a.lodge}\n\nConfermi lo scambio bidirezionale?`
          : ""}
        confirmLabel="Scambia"
        onConfirm={confirmSwap}
        onClose={() => setPendingSwap(null)}
      />
    </>
  );
}
