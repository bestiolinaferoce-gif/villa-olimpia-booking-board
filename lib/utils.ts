import {
  addDays,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isEqual,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { Booking } from "@/lib/types";

export const STORAGE_KEY = "villa-olimpia-booking-board:v1";
export const BACKUP_KEY = "villa-olimpia-booking-board:backups:v1";

export const statusColors: Record<Booking["status"], string> = {
  confirmed: "#16a34a",
  option: "#f59e0b",
  blocked: "#6b7280",
  cancelled: "#dc2626",
};

export const channelLabels: Record<Booking["channel"], string> = {
  direct: "Direct",
  airbnb: "Airbnb",
  booking: "Booking.com",
  expedia: "Expedia",
  other: "Other",
};

export function getMonthDays(baseMonth: Date): Date[] {
  const start = startOfMonth(baseMonth);
  const end = endOfMonth(baseMonth);
  const days: Date[] = [];
  let cursor = start;
  while (!isAfter(cursor, end)) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function toIsoDate(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function isActiveOnDay(booking: Booking, day: Date): boolean {
  const dayStart = startOfDay(day);
  const checkIn = startOfDay(parseISO(booking.checkIn));
  const checkOut = startOfDay(parseISO(booking.checkOut));
  if (isEqual(dayStart, checkOut)) {
    return false;
  }
  return isWithinInterval(dayStart, { start: checkIn, end: addDays(checkOut, -1) });
}

export function overlaps(a: { checkIn: string; checkOut: string }, b: { checkIn: string; checkOut: string }): boolean {
  const aStart = startOfDay(parseISO(a.checkIn));
  const aEnd = startOfDay(parseISO(a.checkOut));
  const bStart = startOfDay(parseISO(b.checkIn));
  const bEnd = startOfDay(parseISO(b.checkOut));
  return isBefore(aStart, bEnd) && isBefore(bStart, aEnd);
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) {
    return "€0";
  }
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
