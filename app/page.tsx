"use client";

import { addDays, format, getMonth, getYear, parseISO, startOfMonth } from "date-fns";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookingBoard } from "@/components/BookingBoard";
import { BookingDialog } from "@/components/BookingDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmailImportDialog } from "@/components/EmailImportDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toast } from "@/components/Toast";
import { Toolbar } from "@/components/Toolbar";
import { PasswordGate } from "@/components/PasswordGate";
import { type Booking, type BookingInput, type Lodge } from "@/lib/types";
import { useBookingStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { getMonthDays, matchesFilters, toIsoDate } from "@/lib/utils";

export default function Home() {
  const { bookings, filters } = useBookingStore(
    useShallow((s) => ({ bookings: s.bookings, filters: s.filters }))
  );
  const { currentMonth, prevMonth, nextMonth, setMonth: setStoreMonth } = useBookingStore(
    useShallow((s) => ({
      currentMonth: s.currentMonth,
      prevMonth: s.prevMonth,
      nextMonth: s.nextMonth,
      setMonth: s.setMonth,
    }))
  );
  const { monthTheme, setMonthTheme } = useBookingStore(
    useShallow((s) => ({ monthTheme: s.monthTheme, setMonthTheme: s.setMonthTheme }))
  );
  const { setSearch, setStatusFilter, setChannelFilter, setShowCancelled } = useBookingStore(
    useShallow((s) => ({
      setSearch: s.setSearch,
      setStatusFilter: s.setStatusFilter,
      setChannelFilter: s.setChannelFilter,
      setShowCancelled: s.setShowCancelled,
    }))
  );
  const { load, addBooking, updateBooking, deleteBooking, importBookingsMerge, exportBookings, showToast } = useBookingStore(
    useShallow((s) => ({
      load: s.load,
      addBooking: s.addBooking,
      updateBooking: s.updateBooking,
      deleteBooking: s.deleteBooking,
      importBookingsMerge: s.importBookingsMerge,
      exportBookings: s.exportBookings,
      showToast: s.showToast,
    }))
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [prefill, setPrefill] = useState<Partial<BookingInput> & { lodge?: Lodge; day?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirm, setImportConfirm] = useState<{ incoming: Booking[] } | null>(null);
  const [emailImportOpen, setEmailImportOpen] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (dialogOpen) return;
      switch (e.key) {
        case "n":
        case "N":
          e.preventDefault();
          setEditing(null);
          setPrefill({});
          setDialogOpen(true);
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevMonth();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextMonth();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen, prevMonth, nextMonth]);

  const monthDate = useMemo(() => parseISO(currentMonth), [currentMonth]);
  const monthDays = useMemo(() => getMonthDays(monthDate), [monthDate]);

  function openNewBooking(lodge?: Lodge, day?: Date) {
    setEditing(null);
    setPrefill({ lodge, day: day ? toIsoDate(day) : undefined });
    setDialogOpen(true);
  }

  function openNewBookingFromPrefill(prefillData: Partial<BookingInput> & { lodge?: Lodge }) {
    setEditing(null);
    setPrefill(prefillData);
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
        setImportConfirm({ incoming });
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Errore durante import.", "error");
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
    const filtered = bookings.filter((booking) => matchesFilters(booking, filters));
    return {
      count: filtered.length,
      total: filtered.reduce((acc, item) => acc + item.totalAmount, 0),
      deposits: filtered.reduce((acc, item) => acc + (item.depositReceived ? item.depositAmount : 0), 0),
    };
  }, [bookings, filters]);

  useEffect(() => {
    const MONTH_ACCENTS: Record<number, string> = {
      0: "#0c4a6e",
      1: "#6b21a8",
      2: "#166534",
      3: "#0d9488",
      4: "#4d7c0f",
      5: "#b45309",
      6: "#c2410c",
      7: "#9f1239",
      8: "#9d174d",
      9: "#3730a3",
      10: "#475569",
      11: "#1d4ed8",
    };
    const accent = monthTheme ? (MONTH_ACCENTS[getMonth(monthDate)] ?? "#1d4ed8") : "#1d4ed8";
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--today-bg", `rgba(${r}, ${g}, ${b}, 0.04)`);
    document.documentElement.style.setProperty("--today-border", `rgba(${r}, ${g}, ${b}, 0.2)`);
  }, [monthDate, monthTheme]);

  const yearOptions = useMemo(() => {
    const year = getYear(monthDate);
    return [year - 2, year - 1, year, year + 1, year + 2];
  }, [monthDate]);

  return (
    <PasswordGate>
    <main className="page-root">
      <Toolbar
        monthDate={monthDate}
        yearOptions={yearOptions}
        onPrev={prevMonth}
        onNext={nextMonth}
        onSetMonth={setStoreMonth}
        onToday={() => setStoreMonth(startOfMonth(new Date()))}
        filters={filters}
        monthTheme={monthTheme}
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onChannelFilter={setChannelFilter}
        onShowCancelled={setShowCancelled}
        onMonthTheme={setMonthTheme}
        onNewBooking={() => openNewBooking()}
        onEmailImport={() => setEmailImportOpen(true)}
        onImportClick={onImportClick}
        onExport={onExport}
        visibleCount={visibleSummary.count}
        visibleTotal={visibleSummary.total}
        visibleDeposits={visibleSummary.deposits}
      />

      <section className="print-title">
        <Image src="/logo-villa-olimpia.png" alt="" width={36} height={36} className="print-logo" />
        <div>
          <h2>Villa Olimpia — Booking Board</h2>
          <p>{format(monthDate, "MMMM yyyy")}</p>
        </div>
      </section>

      <ErrorBoundary>
        <BookingBoard monthDays={monthDays} bookings={bookings} filters={filters} onCreate={openNewBooking} onEdit={openEditBooking} />
      </ErrorBoundary>

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
        initialPrefill={prefill}
        onClose={() => setDialogOpen(false)}
        onCreate={(payload: BookingInput) => addBooking(payload)}
        onUpdate={(id: string, payload: BookingInput) => updateBooking(id, payload)}
        onDelete={(id: string) => deleteBooking(id)}
      />

      <EmailImportDialog
        open={emailImportOpen}
        onClose={() => setEmailImportOpen(false)}
        onCreateFromPrefill={openNewBookingFromPrefill}
      />

      <ConfirmDialog
        open={importConfirm !== null}
        title="Conferma import"
        message="Stai importando prenotazioni da un file JSON. Confermi il merge?"
        confirmLabel="Importa"
        onConfirm={() => {
          if (!importConfirm) return;
          const result = importBookingsMerge(importConfirm.incoming);
          setImportConfirm(null);
          // Naviga al mese della prima prenotazione importata e azzera i filtri
          const sorted = [...importConfirm.incoming].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
          if (sorted.length > 0) {
            setStoreMonth(startOfMonth(parseISO(sorted[0].checkIn)));
          }
          setSearch("");
          setStatusFilter("all");
          setChannelFilter("all");
          showToast(`Import completato: ${result.merged} aggiunte, ${result.skipped} scartate.`);
        }}
        onClose={() => setImportConfirm(null)}
      />

      <Toast />
    </main>
    </PasswordGate>
  );
}
