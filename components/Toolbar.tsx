"use client";

import Image from "next/image";
import { Download, Mail, Plus, Printer, Upload } from "lucide-react";
import { format } from "date-fns";
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
  onExport: () => void;
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
  onExport,
  visibleCount,
  visibleTotal,
  visibleDeposits,
}: ToolbarProps) {
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
        <span>{format(monthDate, "MMMM yyyy")}</span>
      </div>

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
        <div className="group">
          <button type="button" className="ghost-btn" onClick={onNewBooking}>
            <Plus size={15} />
            Nuova prenotazione
          </button>
          <button type="button" className="ghost-btn" onClick={onEmailImport}>
            <Mail size={15} />
            Importa da Email
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

      <SummaryBar count={visibleCount} total={visibleTotal} deposits={visibleDeposits} />
    </section>
  );
}
