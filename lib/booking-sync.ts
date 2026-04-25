import type { Booking } from "@/lib/types";

export type BookingDataOrigin =
  | "manual"
  | "import_json"
  | "import_email"
  | "sync"
  | "n8n";

function parseTimestamp(value?: string): number {
  const ts = Date.parse(value ?? "");
  return Number.isFinite(ts) ? ts : 0;
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

  return Array.from(merged.values()).sort((a, b) =>
    a.checkIn.localeCompare(b.checkIn)
  );
}
