"use client";

import { addDays, differenceInDays, format, getMonth, getYear, isBefore, parseISO, startOfMonth } from "date-fns";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { GanttBoard } from "@/components/GanttBoard";
import { BookingDialog } from "@/components/BookingDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmailImportDialog } from "@/components/EmailImportDialog";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toast } from "@/components/Toast";
import { Toolbar } from "@/components/Toolbar";
import { PasswordGate } from "@/components/PasswordGate";
import { KPIPanel } from "@/components/KPIPanel";
import { type Booking, type BookingInput, type Lodge, LODGES } from "@/lib/types";
import { useBookingStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";
import { getMonthDays, isActiveOnDay, matchesFilters, toIsoDate } from "@/lib/utils";
import { BoardPrintDocument } from "@/components/BoardPrintDocument";
import { PrintOptionsDialog } from "@/components/PrintOptionsDialog";
import { PRINT_SECTIONS_FULL, type PrintSections } from "@/lib/printConfig";
import { MonthSummary, computeLodgeSummaries } from "@/components/MonthSummary";
import { MigrationHelper } from "@/components/MigrationHelper";
import { clearAuthSession } from "@/lib/authSession";
import { runBookingExport, type BookingExportFormat } from "@/lib/bookingExportFormats";
import { reconcileBookings } from "@/lib/reconciliation";

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
  const { load, startPolling, syncError, hasNewBookings, clearNewBookingsNotification, addBooking, updateBooking, deleteBooking, importBookingsMerge, exportBookings, showToast, forceSyncToCloud, syncLocalToCloud } = useBookingStore(
    useShallow((s) => ({
      load: s.load,
      startPolling: s.startPolling,
      syncError: s.syncError,
      hasNewBookings: s.hasNewBookings,
      clearNewBookingsNotification: s.clearNewBookingsNotification,
      addBooking: s.addBooking,
      updateBooking: s.updateBooking,
      deleteBooking: s.deleteBooking,
      importBookingsMerge: s.importBookingsMerge,
      exportBookings: s.exportBookings,
      showToast: s.showToast,
      forceSyncToCloud: s.forceSyncToCloud,
      syncLocalToCloud: s.syncLocalToCloud,
    }))
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [prefill, setPrefill] = useState<Partial<BookingInput> & { lodge?: Lodge; day?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirm, setImportConfirm] = useState<{ incoming: Booking[] } | null>(null);
  const [emailImportOpen, setEmailImportOpen] = useState(false);
  const [printSections, setPrintSections] = useState<PrintSections>(PRINT_SECTIONS_FULL);
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [printLimit, setPrintLimit] = useState<number | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<{ n8nConfigured: boolean; kvConfigured: boolean } | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, [startPolling]);

  useEffect(() => {
    fetch("/api/integrations/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload) => {
        if (payload) setIntegrationStatus(payload);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

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
  const reconciled = useMemo(() => reconcileBookings(bookings), [bookings]);
  const canonicalBookings = reconciled.bookings;

  function openNewBooking(lodge?: Lodge, day?: Date) {
    setEditing(null);
    setPrefill({ lodge, day: day ? toIsoDate(day) : undefined });
    setDialogOpen(true);
  }

  function openNewBookingFromPrefill(prefillData: Partial<BookingInput> & { lodge?: Lodge }) {
    setEditing(null);
    setPrefill({ ...prefillData, dataOrigin: "import_email" });
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

  function onExportFormat(fmt: BookingExportFormat) {
    runBookingExport(fmt, exportBookings(), { jsonFilenameMonth: monthDate });
  }

  function onCopyIcal() {
    const url = `${window.location.origin}/api/calendar`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link iCal copiato! Incollalo in Google Calendar / Airbnb / iPhone.", "success");
    });
  }

  const visibleSummary = useMemo(() => {
    const filtered = canonicalBookings.filter((booking) => matchesFilters(booking, filters));
    return {
      count: filtered.length,
      total: filtered.reduce((acc, item) => acc + item.totalAmount, 0),
      deposits: filtered.reduce((acc, item) => acc + (item.depositReceived ? item.depositAmount : 0), 0),
    };
  }, [canonicalBookings, filters]);

  const newBookingsCount = useMemo(
    () => canonicalBookings.filter((b) => b.isNew).length,
    [canonicalBookings]
  );

  const monthKPIs = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const daysInMonth = monthDays.length;

    const monthBookings = canonicalBookings.filter((b) => {
      if (b.status === "cancelled") return false;
      return isActiveOnDay(b, monthStart) || monthDays.some((day) => isActiveOnDay(b, day));
    });

    const bookingsCount = monthBookings.length;
    const revenue = monthBookings.reduce((acc, b) => {
      const totalNights = differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn));
      if (totalNights <= 0) return acc;
      const nightsInMonth = monthDays.filter((day) => isActiveOnDay(b, day)).length;
      return acc + (b.totalAmount / totalNights) * nightsInMonth;
    }, 0);
    const depositsReceived = monthBookings.reduce(
      (acc, b) => acc + (b.depositReceived ? b.depositAmount : 0),
      0
    );

    // Occupancy: count occupied lodge-nights in the month
    let occupiedLodgeNights = 0;
    for (const lodge of LODGES) {
      const lodgeBookings = canonicalBookings.filter(
        (b) => b.lodge === lodge && b.status !== "cancelled"
      );
      for (const day of monthDays) {
        if (lodgeBookings.some((b) => isActiveOnDay(b, day))) {
          occupiedLodgeNights += 1;
        }
      }
    }
    const occupancyPct = daysInMonth > 0
      ? (occupiedLodgeNights / (LODGES.length * daysInMonth)) * 100
      : 0;

    return { bookingsCount, revenue, depositsReceived, occupancyPct, newBookingsCount };
  }, [canonicalBookings, monthDate, monthDays, newBookingsCount]);

  const lodgeSummaries = useMemo(() => {
    const firstDay = monthDays[0];
    const lastDay = monthDays[monthDays.length - 1];
    const inMonth = firstDay && lastDay
      ? canonicalBookings.filter((b) => {
          let cursor = new Date(firstDay);
          while (!isBefore(lastDay, cursor)) {
            if (isActiveOnDay(b, cursor)) return true;
            cursor = addDays(cursor, 1);
          }
          return false;
        })
      : [];
    return computeLodgeSummaries(monthDate, inMonth);
  }, [canonicalBookings, monthDate, monthDays]);

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

  const printBookings = useMemo(
    () =>
      [...canonicalBookings]
        .filter((b) => matchesFilters(b, filters))
        .sort((a, c) => a.checkIn.localeCompare(c.checkIn)),
    [canonicalBookings, filters]
  );

  const generatedAtLabel = format(new Date(), "dd/MM/yyyy HH:mm");

  function handleLogout() {
    clearAuthSession();
    window.location.assign("/");
  }

  function handlePrintConfirm(nextSections: PrintSections, nextLimit: number | null) {
    flushSync(() => {
      setPrintSections(nextSections);
      setPrintLimit(nextLimit);
      setPrintOptionsOpen(false);
    });
    window.print();
  }

  return (
    <PasswordGate>
    <MigrationHelper />
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
        onExportFormat={onExportFormat}
        onCopyIcal={onCopyIcal}
        onForceSync={() => forceSyncToCloud()}
        onSyncLocal={() => syncLocalToCloud()}
        syncError={syncError}
        integrationStatus={integrationStatus}
        hasNewBookings={hasNewBookings}
        onClearNotification={clearNewBookingsNotification}
        visibleCount={visibleSummary.count}
        visibleTotal={visibleSummary.total}
        visibleDeposits={visibleSummary.deposits}
        newBookingsCount={newBookingsCount}
        onLogout={handleLogout}
        onOpenPrintOptions={() => setPrintOptionsOpen(true)}
      />

      <PrintOptionsDialog
        open={printOptionsOpen}
        onClose={() => setPrintOptionsOpen(false)}
        initialSections={printSections}
        initialLimit={printLimit}
        totalBookings={printBookings.length}
        onConfirmPrint={handlePrintConfirm}
      />

      <BoardPrintDocument
        bookings={printBookings}
        monthLabel={format(monthDate, "MMMM yyyy")}
        generatedAtLabel={generatedAtLabel}
        sections={printSections}
        limit={printLimit}
      />

      <section className="print-title no-print">
        <Image src="/logo-villa-olimpia.png" alt="" width={36} height={36} className="print-logo" />
        <div>
          <h2>Villa Olimpia — Booking Board</h2>
          <p>{format(monthDate, "MMMM yyyy")}</p>
        </div>
      </section>

      <KPIPanel data={monthKPIs} monthLabel={format(monthDate, "MMMM yyyy")} />

      <ErrorBoundary>
        <GanttBoard monthDays={monthDays} bookings={canonicalBookings} filters={filters} onCreate={openNewBooking} onEdit={openEditBooking} />
      </ErrorBoundary>

      <MonthSummary
        monthDate={monthDate}
        lodgeSummaries={lodgeSummaries}
        duplicatesCollapsed={reconciled.duplicatesCollapsed}
        overlapsDetected={reconciled.overlapsDetected}
      />

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

      {syncError && (
        <div className="sync-error-badge" role="status">
          ⚠ Sincronizzazione offline
        </div>
      )}
      <Toast />
    </main>
    </PasswordGate>
  );
}
