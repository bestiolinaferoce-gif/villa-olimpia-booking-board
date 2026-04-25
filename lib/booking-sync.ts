import type { Booking } from "@/lib/types";

export type BookingDataOrigin =
  | "manual"
  | "import_json"
  | "import_email"
  | "sync"
  | "n8n";

const OTA_CHANNELS = new Set<Booking["channel"]>(["airbnb", "booking", "expedia"]);

function parseTimestamp(value?: string): number {
  const ts = Date.parse(value ?? "");
  return Number.isFinite(ts) ? ts : 0;
}

function normalizedText(value?: string): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isGenericOtaGuestName(value?: string): boolean {
  const normalized = normalizedText(value);
  return normalized === "ospiteairbnb" || normalized === "guestairbnb" || normalized === "ospite";
}

function occupancyKey(booking: Booking): string {
  return [
    booking.lodge,
    booking.checkIn,
    booking.checkOut,
    booking.channel,
  ].join("|");
}

function isOtaDuplicateCandidate(booking: Booking): boolean {
  return OTA_CHANNELS.has(booking.channel);
}

function bookingRichnessScore(booking: Booking): number {
  const profile = booking.guestProfile ?? {};
  return [
    booking.totalAmount > 0 ? 1 : 0,
    booking.depositAmount > 0 ? 1 : 0,
    booking.depositReceived ? 1 : 0,
    booking.notes?.trim() ? 1 : 0,
    ...Object.values(profile).map((value) => (value ? 1 : 0)),
  ].reduce((sum, value) => sum + value, 0);
}

function mergeNotes(primary?: string, secondary?: string): string {
  const first = primary?.trim() ?? "";
  const second = secondary?.trim() ?? "";
  if (!first) return second;
  if (!second || first.includes(second)) return first;
  if (second.includes(first)) return second;
  return `${first}\n\n${second}`;
}

function pickPreferredDuplicate(a: Booking, b: Booking): Booking {
  const aOrigin = normalizeDataOrigin(a.dataOrigin);
  const bOrigin = normalizeDataOrigin(b.dataOrigin);

  if (aOrigin === "manual" && bOrigin === "sync") {
    return {
      ...b,
      ...a,
      notes: mergeNotes(a.notes, b.notes),
      dataOrigin: "manual",
    };
  }

  if (bOrigin === "manual" && aOrigin === "sync") {
    return {
      ...a,
      ...b,
      notes: mergeNotes(b.notes, a.notes),
      dataOrigin: "manual",
    };
  }

  if (isGenericOtaGuestName(a.guestName) && !isGenericOtaGuestName(b.guestName)) {
    return { ...a, ...b, notes: mergeNotes(b.notes, a.notes) };
  }

  if (isGenericOtaGuestName(b.guestName) && !isGenericOtaGuestName(a.guestName)) {
    return { ...b, ...a, notes: mergeNotes(a.notes, b.notes) };
  }

  const aScore = bookingRichnessScore(a);
  const bScore = bookingRichnessScore(b);
  if (aScore !== bScore) {
    return aScore > bScore
      ? { ...b, ...a, notes: mergeNotes(a.notes, b.notes) }
      : { ...a, ...b, notes: mergeNotes(b.notes, a.notes) };
  }

  return parseTimestamp(a.updatedAt) >= parseTimestamp(b.updatedAt)
    ? { ...b, ...a, notes: mergeNotes(a.notes, b.notes) }
    : { ...a, ...b, notes: mergeNotes(b.notes, a.notes) };
}

export function dedupeBookings(bookings: Booking[]): Booking[] {
  const deduped = new Map<string, Booking>();

  for (const booking of bookings) {
    const normalizedBooking: Booking = {
      ...booking,
      dataOrigin: normalizeDataOrigin(booking.dataOrigin),
    };

    if (!isOtaDuplicateCandidate(normalizedBooking)) {
      deduped.set(`id:${normalizedBooking.id}`, normalizedBooking);
      continue;
    }

    const key = `ota:${occupancyKey(normalizedBooking)}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, normalizedBooking);
      continue;
    }

    deduped.set(key, pickPreferredDuplicate(existing, normalizedBooking));
  }

  return Array.from(deduped.values()).sort((a, b) =>
    a.checkIn.localeCompare(b.checkIn)
  );
}

export function normalizeDataOrigin(value?: string): BookingDataOrigin {
  switch (value) {
    case "import_json":
    case "import_email":
    case "sync":
    case "n8n":
    case "manual":
      return value;
    default:
      return "manual";
  }
}

export function shouldKeepExistingBooking(
  existing: Booking,
  incoming: Booking
): boolean {
  const existingOrigin = normalizeDataOrigin(existing.dataOrigin);
  const incomingOrigin = normalizeDataOrigin(incoming.dataOrigin);

  // Once a synced booking is manually curated on the board, future OTA syncs
  // must not overwrite host changes.
  if (existingOrigin === "manual" && incomingOrigin === "sync") {
    return true;
  }

  return parseTimestamp(existing.updatedAt) >= parseTimestamp(incoming.updatedAt);
}

export function mergeBookings(
  existing: Booking[],
  incoming: Booking[]
): Booking[] {
  const merged = new Map<string, Booking>();

  for (const booking of existing) {
    merged.set(booking.id, {
      ...booking,
      dataOrigin: normalizeDataOrigin(booking.dataOrigin),
    });
  }

  for (const rawBooking of incoming) {
    const incomingBooking: Booking = {
      ...rawBooking,
      dataOrigin: normalizeDataOrigin(rawBooking.dataOrigin),
    };
    const current = merged.get(incomingBooking.id);

    if (!current) {
      merged.set(incomingBooking.id, incomingBooking);
      continue;
    }

    if (shouldKeepExistingBooking(current, incomingBooking)) {
      continue;
    }

    merged.set(incomingBooking.id, {
      ...current,
      ...incomingBooking,
      dataOrigin: normalizeDataOrigin(incomingBooking.dataOrigin),
    });
  }

  return dedupeBookings(Array.from(merged.values()));
}
