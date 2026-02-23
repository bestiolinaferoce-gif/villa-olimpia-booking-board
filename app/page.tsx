"use client";

import * as Popover from "@radix-ui/react-popover";
import { addDays, format, getMonth, getYear, parseISO, setMonth, setYear, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Plus, Printer, Upload, Download, CircleHelp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookingBoard } from "@/components/BookingBoard";
import { BookingDialog } from "@/components/BookingDialog";
import { BOOKING_CHANNELS, BOOKING_STATUSES, type Booking, type BookingInput, type Lodge } from "@/lib/types";
import { useBookingStore } from "@/lib/store";
import { channelLabels, formatMoney, getMonthDays, statusColors, toIsoDate } from "@/lib/utils";

const monthNames = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

export default function Home() {
  const {
    bookings,
    currentMonth,
    filters,
    load,
    setMonth: setStoreMonth,
    prevMonth,
    nextMonth,
    setSearch,
    setStatusFilter,
    setChannelFilter,
    setShowCancelled,
    addBooking,
    updateBooking,
    deleteBooking,
    importBookingsMerge,
    exportBookings,
  } = useBookingStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [prefill, setPrefill] = useState<{ lodge?: Lodge; day?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [load]);

  const monthDate = useMemo(() => parseISO(currentMonth), [currentMonth]);
  const monthDays = useMemo(() => getMonthDays(monthDate), [monthDate]);

  function openNewBooking(lodge?: Lodge, day?: Date) {
    setEditing(null);
    setPrefill({ lodge, day: day ? toIsoDate(day) : undefined });
    setDialogOpen(true);
  }

  function openEditBooking(booking: Booking) {
    setEditing(booking);
    setPrefill({});
    setDialogOpen(true);
  }

  function onImportClick() {
    fileInputRef.current?.click();
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const incoming: Booking[] = Array.isArray(parsed) ? parsed : parsed.bookings;
        if (!Array.isArray(incoming)) {
          throw new Error("Formato JSON non valido.");
        }
        const ok = window.confirm("Confermi merge delle prenotazioni dal file JSON?");
        if (!ok) {
          return;
        }
        const result = importBookingsMerge(incoming);
        window.alert(`Import completato. Merge: ${result.merged}, scartate: ${result.skipped}.`);
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Errore durante import.");
      }
    };
    reader.readAsText(file);
  }

  function onExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      bookings: exportBookings(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `villa-olimpia-booking-board-${format(monthDate, "yyyy-MM")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visibleSummary = useMemo(() => {
    const filtered = bookings.filter((booking) => {
      if (filters.status !== "all" && booking.status !== filters.status) {
        return false;
      }
      if (filters.channel !== "all" && booking.channel !== filters.channel) {
        return false;
      }
      if (!filters.showCancelled && booking.status === "cancelled") {
        return false;
      }
      if (filters.search.trim() && !booking.guestName.toLowerCase().includes(filters.search.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
    return {
      count: filtered.length,
      total: filtered.reduce((acc, item) => acc + item.totalAmount, 0),
      deposits: filtered.reduce((acc, item) => acc + item.depositAmount, 0),
    };
  }, [bookings, filters]);

  const yearOptions = useMemo(() => {
    const year = getYear(monthDate);
    return [year - 2, year - 1, year, year + 1, year + 2];
  }, [monthDate]);

  return (
    <main className="page-root">
      <section className="toolbar no-print">
        <div className="title-row">
          <h1>Villa Olimpia — Booking Board</h1>
          <span>{format(monthDate, "MMMM yyyy")}</span>
        </div>

        <div className="controls-row">
          <div className="group">
            <button type="button" className="ghost-btn" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" className="ghost-btn" onClick={nextMonth}>
              <ChevronRight size={16} />
            </button>
            <select
              value={getMonth(monthDate)}
              onChange={(e) => setStoreMonth(setMonth(monthDate, Number(e.target.value)))}
            >
              {monthNames.map((month, idx) => (
                <option key={month} value={idx}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={getYear(monthDate)}
              onChange={(e) => setStoreMonth(setYear(monthDate, Number(e.target.value)))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button type="button" className="ghost-btn" onClick={() => setStoreMonth(startOfMonth(new Date()))}>
              Oggi
            </button>
          </div>

          <div className="group grow">
            <input
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca ospite"
              className="grow"
            />
            <select value={filters.status} onChange={(e) => setStatusFilter(e.target.value as (typeof filters)["status"])}>
              <option value="all">Status: tutti</option>
              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select value={filters.channel} onChange={(e) => setChannelFilter(e.target.value as (typeof filters)["channel"])}>
              <option value="all">Canale: tutti</option>
              {BOOKING_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channelLabels[channel]}
                </option>
              ))}
            </select>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={filters.showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
              />
              Mostra cancellate
            </label>
          </div>

          <div className="group">
            <button type="button" className="ghost-btn" onClick={() => openNewBooking()}>
              <Plus size={15} />
              Nuova prenotazione
            </button>
            <button type="button" className="ghost-btn" onClick={onImportClick}>
              <Upload size={15} />
              Import JSON
            </button>
            <button type="button" className="ghost-btn" onClick={onExport}>
              <Download size={15} />
              Export JSON
            </button>
            <button type="button" className="ghost-btn" onClick={() => window.print()}>
              <Printer size={15} />
              Stampa
            </button>
          </div>
        </div>

        <div className="meta-row">
          <div className="summary-card">
            <CalendarDays size={16} />
            <span>Prenotazioni visibili: {visibleSummary.count}</span>
          </div>
          <div className="summary-card">
            <Filter size={16} />
            <span>Totale: {formatMoney(visibleSummary.total)}</span>
          </div>
          <div className="summary-card">
            <Filter size={16} />
            <span>Caparre: {formatMoney(visibleSummary.deposits)}</span>
          </div>
          <Popover.Root>
            <Popover.Trigger asChild>
              <button type="button" className="ghost-btn">
                <CircleHelp size={15} />
                Legenda
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content sideOffset={8} className="popover-content">
                <strong>Legenda stati</strong>
                <ul>
                  {BOOKING_STATUSES.map((status) => (
                    <li key={status}>
                      <span className="dot" style={{ background: statusColors[status] }} />
                      {status}
                    </li>
                  ))}
                </ul>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </section>

      <section className="print-title">
        <h2>Villa Olimpia — Booking Board</h2>
        <p>{format(monthDate, "MMMM yyyy")}</p>
      </section>

      <BookingBoard monthDays={monthDays} bookings={bookings} filters={filters} onCreate={openNewBooking} onEdit={openEditBooking} />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onImportFile(file);
          }
          e.currentTarget.value = "";
        }}
      />

      <BookingDialog
        open={dialogOpen}
        booking={editing}
        initialLodge={prefill.lodge}
        initialDate={prefill.day || addDays(new Date(), 1).toISOString().slice(0, 10)}
        onClose={() => setDialogOpen(false)}
        onCreate={(payload: BookingInput) => addBooking(payload)}
        onUpdate={(id: string, payload: BookingInput) => updateBooking(id, payload)}
        onDelete={(id: string) => deleteBooking(id)}
      />
    </main>
  );
}
