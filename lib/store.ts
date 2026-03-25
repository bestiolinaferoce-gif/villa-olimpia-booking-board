import { create } from "zustand";
import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import {
  BOOKING_CHANNELS,
  BOOKING_STATUSES,
  type BackupSnapshot,
  type Booking,
  type BookingFilters,
  type BookingInput,
} from "@/lib/types";
import { BACKUP_KEY, overlaps, SETTINGS_KEY, STORAGE_KEY } from "@/lib/utils";

type BookingState = {
  bookings: Booking[];
  currentMonth: string;
  filters: BookingFilters;
  monthTheme: boolean;
  serverVersion: number;
  syncError: boolean;
  hasNewBookings: boolean;
  load: () => void;
  startPolling: () => () => void;
  stopPolling: () => void;
  clearNewBookingsNotification: () => void;
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
  forceSyncToCloud: () => Promise<void>;
  syncLocalToCloud: () => Promise<{ merged: number; total: number }>;
  toast: { message: string; type: "success" | "error" } | null;
  showToast: (message: string, type?: "success" | "error") => void;
  clearToast: () => void;
};

/** Export Airbnb / CSV spesso hanno `source` senza `channel`, e niente `status`: senza questo l'import scarta tutto. */
function channelAndStatusFromImport(item: Partial<Booking> & { source?: string }): {
  channel: Booking["channel"];
  status: Booking["status"];
} {
  let channel: Booking["channel"] = "direct";
  if (item.channel && (BOOKING_CHANNELS as readonly string[]).includes(item.channel)) {
    channel = item.channel;
  } else {
    const s = String(item.source ?? "").toLowerCase();
    if (s.includes("airbnb")) channel = "airbnb";
    else if (s.includes("booking")) channel = "booking";
    else if (s.includes("expedia")) channel = "expedia";
    else if (s.includes("other")) channel = "other";
  }
  let status: Booking["status"] = "confirmed";
  if (item.status && (BOOKING_STATUSES as readonly string[]).includes(item.status)) {
    status = item.status;
  }
  return { channel, status };
}

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

function migrateBookings(arr: Array<Booking & { guestsCount?: number }>): Booking[] {
  return arr.map((item) => ({
    ...item,
    guestsCount: typeof item.guestsCount === "number" && item.guestsCount >= 1 ? item.guestsCount : 2,
  })) as Booking[];
}

function persistSettings(settings: { monthTheme: boolean }): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const useBookingStore = create<BookingState>((set, get) => {
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  function persist(bookings: Booking[]): void {
    if (typeof window === "undefined") return;
    if (persistTimer !== null) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      const write = () => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
        fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings }),
        })
          .then(async (r) => {
            if (r.ok) {
              const res = (await r.json()) as { ok: boolean; v?: number };
              if (typeof res.v === "number") set({ serverVersion: res.v, syncError: false });
            }
          })
          .catch(() => set({ syncError: true }));
        const raw = window.localStorage.getItem(BACKUP_KEY);
        const current: BackupSnapshot[] = raw ? JSON.parse(raw) : [];
        const merged = [{ createdAt: new Date().toISOString(), bookings }, ...current].slice(0, 10);
        window.localStorage.setItem(BACKUP_KEY, JSON.stringify(merged));
      };
      if (typeof requestIdleCallback !== "undefined") requestIdleCallback(write);
      else write();
    }, 250);
  }

  return {
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
  serverVersion: 0,
  syncError: false,
  hasNewBookings: false,
  load: () => {
    if (typeof window === "undefined") return;
    const rawSettings = window.localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      try {
        const s = JSON.parse(rawSettings) as { monthTheme?: boolean };
        if (typeof s.monthTheme === "boolean") set({ monthTheme: s.monthTheme });
      } catch { /* ignore */ }
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const cached = JSON.parse(raw) as Array<Booking & { guestsCount?: number }>;
        set({ bookings: migrateBookings(cached) });
      } catch { /* ignore */ }
    }
    fetch("/api/bookings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: { v: number; ts: string; data: Booking[] } | null) => {
        if (!payload) return;
        const data = Array.isArray(payload) ? payload : (payload.data ?? []);
        if (data.length > 0) {
          const migrated = migrateBookings(data as Array<Booking & { guestsCount?: number }>);
          set({ bookings: migrated, serverVersion: payload.v ?? 0, syncError: false });
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          const cur = get().bookings;
          if (cur.length > 0) {
            fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bookings: cur }),
            }).catch(() => {});
          }
        }
      })
      .catch(() => set({ syncError: true }));
  },
  startPolling: () => {
    const INTERVAL = 30_000;
    let active = true;
    const poll = async () => {
      if (!active || typeof window === "undefined") return;
      try {
        const res = await fetch("/api/bookings/version", { cache: "no-store" });
        if (!res.ok) throw new Error("poll failed");
        const { v } = (await res.json()) as { v: number };
        const currentVersion = get().serverVersion;
        if (v > currentVersion) {
          const full = await fetch("/api/bookings", { cache: "no-store" });
          if (!full.ok) throw new Error("full fetch failed");
          const payload = (await full.json()) as { v?: number; data?: Booking[] } | Booking[];
          const data = Array.isArray(payload) ? payload : (payload.data ?? []);
          const migrated = migrateBookings(data as Array<Booking & { guestsCount?: number }>);
          const newV = Array.isArray(payload) ? 0 : (payload.v ?? v);
          set({ bookings: migrated, serverVersion: newV, syncError: false, hasNewBookings: true });
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          }
        }
      } catch { /* silent — non aggiornare syncError da polling */ }
      if (active) setTimeout(poll, INTERVAL);
    };
    const firstTimer = setTimeout(poll, 5_000);
    return () => {
      active = false;
      clearTimeout(firstTimer);
    };
  },
  stopPolling: () => { /* gestito dall'active flag nel cleanup di startPolling */ },
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
  clearNewBookingsNotification: () => set({ hasNewBookings: false }),
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
      isNew: true,
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
      isNew: payload.isNew ?? false,
      guestName: payload.guestName.trim(),
      notes: payload.notes.trim(),
      updatedAt: new Date().toISOString(),
      guestProfile: payload.guestProfile ?? current.guestProfile,
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
        const { channel, status } = channelAndStatusFromImport(item);
        return {
          ...item,
          channel,
          status,
          guestName: String(item.guestName),
          notes: String(item.notes ?? ""),
          guestsCount,
          totalAmount: Number(
            item.totalAmount ?? (item as { grossEarnings?: number }).grossEarnings ?? 0
          ),
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
  forceSyncToCloud: async () => {
    if (typeof window === "undefined") return;
    const cur = get().bookings;
    if (cur.length === 0) {
      get().showToast("Nessuna prenotazione da caricare.", "error");
      return;
    }
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings: cur }),
      });
      if (r.ok) {
        const res = (await r.json()) as { ok: boolean; v?: number };
        if (typeof res.v === "number") set({ serverVersion: res.v, syncError: false });
        get().showToast(`✓ ${cur.length} prenotazioni caricate sul cloud (v${res.v ?? "?"}).`);
      } else {
        get().showToast("Errore durante il caricamento sul cloud.", "error");
      }
    } catch {
      set({ syncError: true });
      get().showToast("Errore di rete durante il sync.", "error");
    }
  },
  syncLocalToCloud: async () => {
    let local: Booking[] = [];
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) local = JSON.parse(raw) as Booking[];
    } catch {
      local = [];
    }

    if (local.length === 0) {
      get().showToast("Nessuna prenotazione locale da sincronizzare.", "error");
      return { merged: 0, total: 0 };
    }

    try {
      const res = await fetch("/api/bookings/merge-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings: local }),
      });
      const data = (await res.json()) as {
        merged?: number;
        total?: number;
        error?: string;
      };

      if (res.ok) {
        get().showToast(
          `Sync completata: ${data.merged ?? 0} nuove prenotazioni aggiunte (totale: ${data.total ?? 0}).`
        );
        await get().load();
        return { merged: data.merged ?? 0, total: data.total ?? 0 };
      } else {
        get().showToast(
          "Errore durante la sincronizzazione: " + (data.error ?? "unknown"),
          "error"
        );
        return { merged: 0, total: 0 };
      }
    } catch {
      get().showToast("Errore di rete durante la sincronizzazione.", "error");
      return { merged: 0, total: 0 };
    }
  },
  };
});
