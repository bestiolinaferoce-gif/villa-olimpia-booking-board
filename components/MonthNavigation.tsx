"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonth, getYear, setMonth, setYear } from "date-fns";

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

type MonthNavigationProps = {
  monthDate: Date;
  yearOptions: number[];
  onPrev: () => void;
  onNext: () => void;
  onSetMonth: (month: Date) => void;
  onToday: () => void;
};

export function MonthNavigation({
  monthDate,
  yearOptions,
  onPrev,
  onNext,
  onSetMonth,
  onToday,
}: MonthNavigationProps) {
  return (
    <div className="group">
      <button type="button" className="ghost-btn" onClick={onPrev}>
        <ChevronLeft size={16} />
      </button>
      <button type="button" className="ghost-btn" onClick={onNext}>
        <ChevronRight size={16} />
      </button>
      <select
        value={getMonth(monthDate)}
        onChange={(e) => onSetMonth(setMonth(monthDate, Number(e.target.value)))}
      >
        {monthNames.map((month, idx) => (
          <option key={month} value={idx}>
            {month}
          </option>
        ))}
      </select>
      <select
        value={getYear(monthDate)}
        onChange={(e) => onSetMonth(setYear(monthDate, Number(e.target.value)))}
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button type="button" className="ghost-btn" onClick={onToday}>
        Oggi
      </button>
    </div>
  );
}
