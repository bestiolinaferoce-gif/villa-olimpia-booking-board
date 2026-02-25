import { create } from "zustand";
import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import type { BackupSnapshot, Booking, BookingFilters, BookingInput } from "@/lib/types";
import { BACKUP_KEY, overlaps, SETTINGS_KEY, STORAGE_KEY } from "@/lib/utils";

type BookingState = {
  bookings: Booking[];
  currentMonth: string;
  filters: BookingFilters;
  monthTheme: boolean;
  load: () => void;
  setMonthTheme: (value: boolean) => void;
  setMonth: (month: Date) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  setSearch: (value: string) => void;
  setStatusFilter: (value: BookingFilters["status"]) => void;
  setChannelFilter: (value: BookingFilters["channel"]) => void;
  setShowCancelled: (value: boolean) => void;
  addBooking: (payload: BookingInput) => Booking;
  updateBooking: (id: string, payload: BookingInput) => Booking;
  deleteBooking: (id: string) => void;
  importBookingsMerge: (incoming: Booking[]) => { merged: number; skipped: number };
  exportBookings: () => Booking[];
  toast: { message: string; type: "success" | "error" } | null;
  showToast: (message: string, type?: "success" | "error") => void;
  clearToast: () => void;
};

function validateBookingPayload(payload: BookingInput): void {
  if (!payload.guestName.trim()) {
    throw new Error("Il nome ospite è obbligatorio.");
  }
  if (!payload.checkIn || !payload.checkOut) {
    throw new Error("Check-in e check-out sono obbligatori.");
  }
  const checkIn = parseISO(payload.checkIn);
  const checkOut = parseISO(payload.checkOut);
  if (!(checkIn < checkOut)) {
    throw new Error("Il check-out deve essere successivo al check-in.");
  }
  if (payload.guestsCount < 1 || !Number.isInteger(payload.guestsCount)) {
    throw new Error("Il numero ospiti deve essere almeno 1.");
  }
  if (payload.totalAmount < 0 || payload.depositAmount < 0) {
    throw new Error("Gli importi non possono essere negativi.");
  }
  if (payload.depositAmount > payload.totalAmount) {
    throw new Error("La caparra non può superare il totale.");
  }
  if (payload.depositReceived && payload.depositAmount <= 0) {
    throw new Error("Caparra ricevuta richiede un importo caparra maggiore di zero.");
  }
}

function ensureNoOverlap(bookings: Booking[], payload: BookingInput, excludeId?: string): void {
  const colliding = bookings.find((booking) => {
    if (excludeId && booking.id === excludeId) {
      return false;
    }
    if (booking.lodge !== payload.lodge) {
      return false;
    }
    if (booking.status === "cancelled") {
      return false;
    }
    if (payload.status === "cancelled") {
      return false;
    }
    return overlaps(booking, payload);
  });
  if (colliding) {
    throw new Error(`Sovrapposizione su ${payload.lodge} con prenotazione ${colliding.guestName} (${colliding.checkIn} → ${colliding.checkOut}).`);
  }
}

// Debounce timer per persist: mutazioni rapide consecutive producono una sola scrittura.
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persist(bookings: Booking[]): void {
  if (typeof window === "undefined") {
    return;
  }
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const write = () => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
      const raw = window.localStorage.getItem(BACKUP_KEY);
      const current: BackupSnapshot[] = raw ? JSON.parse(raw) : [];
      const snapshot: BackupSnapshot = {
        createdAt: new Date().toISOString(),
        bookings,
      };
      const merged = [snapshot, ...current].slice(0, 10);
      window.localStorage.setItem(BACKUP_KEY, JSON.stringify(merged));
    };
    // requestIdleCallback: scrive quando il browser è idle (Chrome/Firefox).
    // Fallback sincrono su Safari e ambienti senza supporto.
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(write);
    } else {
      write();
    }
  }, 250);
}

function persistSettings(settings: { monthTheme: boolean }): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  currentMonth: format(startOfMonth(new Date()), "yyyy-MM-01"),
  filters: {
    search: "",
    status: "all",
    channel: "all",
    showCancelled: false,
  },
  monthTheme: true,
  toast: null,
  load: () => {
    if (typeof window === "undefined") {
      return;
    }
    const rawSettings = window.localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      try {
        const settings = JSON.parse(rawSettings) as { monthTheme?: boolean };
        if (typeof settings.monthTheme === "boolean") {
          set({ monthTheme: settings.monthTheme });
        }
      } catch {
        // ignore malformed settings
      }
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Array<Booking & { guestsCount?: number }>;
      const migrated = parsed.map((item) => ({
        ...item,
        guestsCount: typeof item.guestsCount === "number" && item.guestsCount >= 1 ? item.guestsCount : 2,
      })) as Booking[];
      const needsPersist = migrated.some((b, i) => typeof parsed[i]?.guestsCount !== "number");
      set({ bookings: migrated });
      if (needsPersist) persist(migrated);
    } catch {
      set({ bookings: [] });
    }
  },
  setMonth: (month) => set({ currentMonth: format(startOfMonth(month), "yyyy-MM-01") }),
  prevMonth: () => {
    const month = parseISO(get().currentMonth);
    set({ currentMonth: format(addMonths(month, -1), "yyyy-MM-01") });
  },
  nextMonth: () => {
    const month = parseISO(get().currentMonth);
    set({ currentMonth: format(addMonths(month, 1), "yyyy-MM-01") });
  },
  setSearch: (value) => set((state) => ({ filters: { ...state.filters, search: value } })),
  setStatusFilter: (value) => set((state) => ({ filters: { ...state.filters, status: value } })),
  setChannelFilter: (value) => set((state) => ({ filters: { ...state.filters, channel: value } })),
  setShowCancelled: (value) => set((state) => ({ filters: { ...state.filters, showCancelled: value } })),
  setMonthTheme: (value) => {
    set({ monthTheme: value });
    persistSettings({ monthTheme: value });
  },
  showToast: (message, type = "success") => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
  addBooking: (payload) => {
    validateBookingPayload(payload);
    const bookings = get().bookings;
    ensureNoOverlap(bookings, payload);
    const now = new Date().toISOString();
    const booking: Booking = {
      id: uuidv4(),
      ...payload,
      guestName: payload.guestName.trim(),
      notes: payload.notes.trim(),
      guestsCount: payload.guestsCount,
      createdAt: now,
      updatedAt: now,
    };
    const next = [...bookings, booking].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    set({ bookings: next });
    persist(next);
    return booking;
  },
  updateBooking: (id, payload) => {
    validateBookingPayload(payload);
    const bookings = get().bookings;
    const current = bookings.find((booking) => booking.id === id);
    if (!current) {
      throw new Error("Prenotazione non trovata.");
    }
    ensureNoOverlap(bookings, payload, id);
    const updated: Booking = {
      ...current,
      ...payload,
      guestName: payload.guestName.trim(),
      notes: payload.notes.trim(),
      updatedAt: new Date().toISOString(),
    };
    const next = bookings.map((booking) => (booking.id === id ? updated : booking)).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    set({ bookings: next });
    persist(next);
    return updated;
  },
  deleteBooking: (id) => {
    const next = get().bookings.filter((booking) => booking.id !== id);
    set({ bookings: next });
    persist(next);
  },
  importBookingsMerge: (incoming) => {
    const normalized = incoming
      .filter((item) => item && item.id && item.guestName)
      .map((item) => {
        const guestsCount = typeof item.guestsCount === "number" && item.guestsCount >= 1 ? item.guestsCount : 2;
        return {
          ...item,
          guestName: String(item.guestName),
          notes: String(item.notes ?? ""),
          guestsCount,
          totalAmount: Number(item.totalAmount ?? 0),
          depositAmount: Number(item.depositAmount ?? 0),
          depositReceived: Boolean(item.depositReceived),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }) as Booking[];

    const map = new Map<string, Booking>();
    get().bookings.forEach((booking) => map.set(booking.id, booking));

    let merged = 0;
    let skipped = 0;

    normalized.forEach((candidate) => {
      try {
        const guestsCount = typeof candidate.guestsCount === "number" && candidate.guestsCount >= 1 ? candidate.guestsCount : 2;
        const payload: BookingInput = {
          guestName: candidate.guestName,
          lodge: candidate.lodge,
          checkIn: candidate.checkIn,
          checkOut: candidate.checkOut,
          status: candidate.status,
          channel: candidate.channel,
          notes: candidate.notes,
          guestsCount,
          totalAmount: candidate.totalAmount,
          depositAmount: candidate.depositAmount,
          depositReceived: candidate.depositReceived,
        };
        validateBookingPayload(payload);
        ensureNoOverlap(Array.from(map.values()), payload, candidate.id);
        map.set(candidate.id, candidate);
        merged += 1;
      } catch {
        skipped += 1;
      }
    });

    const next = Array.from(map.values()).sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    set({ bookings: next });
    persist(next);
    return { merged, skipped };
  },
  exportBookings: () => get().bookings,
}));
