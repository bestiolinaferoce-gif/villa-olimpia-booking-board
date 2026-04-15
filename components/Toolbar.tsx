"use client";

import Image from "next/image";
import Link from "next/link";
import * as Popover from "@radix-ui/react-popover";
import {
  Calendar,
  ChevronDown,
  CloudUpload,
  Download,
  FileText,
  LogOut,
  Mail,
  Plus,
  Printer,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import type { BookingExportFormat } from "@/lib/bookingExportFormats";
import { BoardHeaderExtras } from "@/components/BoardHeaderExtras";
import { FilterBar } from "@/components/FilterBar";
import { MonthNavigation } from "@/components/MonthNavigation";
import { SummaryBar } from "@/components/SummaryBar";
import type { BookingFilters } from "@/lib/types";

type ToolbarProps = {
  // title row
  monthDate: Date;
  // month navigation
  yearOptions: number[];
  onPrev: () => void;
  onNext: () => void;
  onSetMonth: (month: Date) => void;
  onToday: () => void;
  // filter bar
  filters: BookingFilters;
  monthTheme: boolean;
  onSearch: (v: string) => void;
  onStatusFilter: (v: BookingFilters["status"]) => void;
  onChannelFilter: (v: BookingFilters["channel"]) => void;
  onShowCancelled: (v: boolean) => void;
  onMonthTheme: (v: boolean) => void;
  // action buttons
  onNewBooking: () => void;
  onEmailImport: () => void;
  onImportClick: () => void;
  onExportFormat: (format: BookingExportFormat) => void;
  onCopyIcal: () => void;
  onForceSync: () => void;
  onSyncLocal?: () => void;
  syncError: boolean;
  integrationStatus?: { n8nConfigured: boolean; kvConfigured: boolean } | null;
  hasNewBookings?: boolean;
  onClearNotification?: () => void;
  newBookingsCount?: number;
  onLogout?: () => void;
  onOpenPrintOptions?: () => void;
  // summary bar
  visibleCount: number;
  visibleTotal: number;
  visibleDeposits: number;
};

export function Toolbar({
  monthDate,
  yearOptions,
  onPrev,
  onNext,
  onSetMonth,
  onToday,
  filters,
  monthTheme,
  onSearch,
  onStatusFilter,
  onChannelFilter,
  onShowCancelled,
  onMonthTheme,
  onNewBooking,
  onEmailImport,
  onImportClick,
  onExportFormat,
  onCopyIcal,
  onForceSync,
  onSyncLocal,
  syncError,
  integrationStatus,
  hasNewBookings = false,
  onClearNotification,
  visibleCount,
  visibleTotal,
  visibleDeposits,
  newBookingsCount = 0,
  onLogout,
  onOpenPrintOptions,
}: ToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <section className="toolbar no-print">
      <div className="title-row">
        <div className="header-brand">
          <Image
            src="/logo-villa-olimpia.png"
            alt="Villa Olimpia"
            width={28}
            height={28}
            className="header-logo"
          />
          <h1>Villa Olimpia — Booking Board</h1>
        </div>
        <div className="title-row-right">
          <span className="month-pill">{format(monthDate, "MMMM yyyy")}</span>
          {onLogout ? (
            <button type="button" className="logout-btn" onClick={onLogout} title="Esci dalla sessione">
              <LogOut size={15} />
              Logout
            </button>
          ) : null}
        </div>
      </div>

      <BoardHeaderExtras monthTheme={monthTheme} />

      <div className="controls-row">
        <MonthNavigation
          monthDate={monthDate}
          yearOptions={yearOptions}
          onPrev={onPrev}
          onNext={onNext}
          onSetMonth={onSetMonth}
          onToday={onToday}
        />
        <FilterBar
          filters={filters}
          monthTheme={monthTheme}
          onSearch={onSearch}
          onStatusFilter={onStatusFilter}
          onChannelFilter={onChannelFilter}
          onShowCancelled={onShowCancelled}
          onMonthTheme={onMonthTheme}
        />
        <div className="group toolbar-actions">
          <button type="button" className="ghost-btn" onClick={onNewBooking}>
            <Plus size={15} />
            Nuova prenotazione
          </button>
          <Link
            href="/preventivi"
            className="ghost-btn"
            title="Apri il modulo Preventivi"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <FileText size={15} />
            Crea preventivo
          </Link>
          <button type="button" className="ghost-btn" onClick={onEmailImport}>
            <Mail size={15} />
            Importa da Email
          </button>
          <button type="button" className="ghost-btn" onClick={onImportClick}>
            <Upload size={15} />
            Import JSON
          </button>
          <Popover.Root open={exportOpen} onOpenChange={setExportOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="ghost-btn export-trigger"
                aria-expanded={exportOpen}
                aria-haspopup="dialog"
                title="Esporta prenotazioni"
              >
                <Download size={15} />
                Esporta
                <ChevronDown size={14} className="export-chevron" aria-hidden />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="popover-content export-format-menu"
                sideOffset={6}
                align="start"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <p className="export-format-title">Formato</p>
                <div className="export-format-list">
                  <button
                    type="button"
                    className="export-format-item"
                    onClick={() => {
                      onExportFormat("json");
                      setExportOpen(false);
                    }}
                  >
                    Esporta JSON
                  </button>
                  <button
                    type="button"
                    className="export-format-item"
                    onClick={() => {
                      onExportFormat("txt-notebooklm");
                      setExportOpen(false);
                    }}
                  >
                    Esporta TXT per NotebookLM
                  </button>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <button
            type="button"
            className="ghost-btn"
            title="Copia URL iCal"
            onClick={onCopyIcal}
          >
            <Calendar size={15} />
            iCal
          </button>
          <button
            type="button"
            className={syncError ? "ghost-btn danger-btn" : "ghost-btn"}
            title={syncError ? "Sincronizzazione non riuscita — ritenta il sync bidirezionale" : "Sincronizza locale e cloud"}
            onClick={onForceSync}
          >
            <CloudUpload size={15} />
            {syncError ? "Sync ⚠" : "Sync"}
          </button>
          {onSyncLocal && (
            <button
              type="button"
              className="ghost-btn"
              title="Ricarica e riallinea i dati dal cloud"
              onClick={onSyncLocal}
            >
              ☁️ Aggiorna
            </button>
          )}
          {integrationStatus && (
            <span
              className={integrationStatus.n8nConfigured && integrationStatus.kvConfigured ? "sync-ok" : "sync-error"}
              title={
                integrationStatus.n8nConfigured && integrationStatus.kvConfigured
                  ? "KV e n8n configurati"
                  : "Una o più integrazioni non sono configurate"
              }
            >
              {integrationStatus.n8nConfigured && integrationStatus.kvConfigured ? "n8n ✓" : "n8n ⚠"}
            </span>
          )}
          {hasNewBookings && (
            <button
              type="button"
              className="btn-notify"
              onClick={onClearNotification}
              title={`${newBookingsCount} nuova/e prenotazione/i`}
            >
              <span className="notify-dot" />
              🔔 {newBookingsCount > 0 ? `+${newBookingsCount}` : ""} Nuova
            </button>
          )}
          {syncError && (
            <span
              className="sync-error"
              title="Sincronizzazione fallita — dati mostrati potrebbero non essere aggiornati"
            >
              ⚠ Offline
            </span>
          )}
          <button
            type="button"
            className="ghost-btn"
            onClick={() => (onOpenPrintOptions ? onOpenPrintOptions() : window.print())}
          >
            <Printer size={15} />
            Stampa
          </button>
        </div>
      </div>

      <SummaryBar count={visibleCount} total={visibleTotal} deposits={visibleDeposits} newBookingsCount={newBookingsCount} />
    </section>
  );
}
