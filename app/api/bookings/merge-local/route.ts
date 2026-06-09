import { NextRequest, NextResponse } from "next/server";
import { bookingWriteAuthError, kvNotConfiguredResponse } from "@/lib/bookingsApiAuth";
import type { Booking } from "@/lib/types";
import {
  capDeletedIds,
  casWriteBookingsKV,
  kvConfigured,
  readBookingsKV,
  type KVBookingsPayload,
} from "@/lib/kvCas";
import {
  notifyN8NBookingEvents,
  type N8nBookingEventName,
  type N8nBookingEventPayload,
} from "@/lib/n8nBookingWebhook";

const PROPERTY = "villa-olimpia";

function bookingUpdatedMs(booking: Booking): number {
  const ts = Date.parse(booking.updatedAt || booking.createdAt || "");
  return Number.isFinite(ts) ? ts : 0;
}

/** Notti su date-only YYYY-MM-DD in UTC: immune da timezone del server e DST. */
function calculateNights(checkIn: string, checkOut: string) {
  const toUtc = (iso: string): number => {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return NaN;
    return Date.UTC(y, m - 1, d);
  };
  const start = toUtc(checkIn);
  const end = toUtc(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function toBookingEvent(event: N8nBookingEventName, booking: Booking): N8nBookingEventPayload {
  return {
    event,
    bookingId: booking.id,
    property: PROPERTY,
    guestName: booking.guestName,
    guestEmail: "",
    guestPhone: "",
    checkin: booking.checkIn,
    checkout: booking.checkOut,
    nights: calculateNights(booking.checkIn, booking.checkOut),
    guests: booking.guestsCount,
    lodge: booking.lodge,
    totalAmount: booking.totalAmount,
    depositAmount: booking.depositAmount,
    depositPaid: booking.depositReceived,
    notes: booking.notes,
    source: "booking-board",
  };
}

function hasBookingChanged(previous: Booking, current: Booking) {
  return previous.guestName !== current.guestName ||
    previous.lodge !== current.lodge ||
    previous.checkIn !== current.checkIn ||
    previous.checkOut !== current.checkOut ||
    previous.status !== current.status ||
    previous.channel !== current.channel ||
    previous.notes !== current.notes ||
    previous.guestsCount !== current.guestsCount ||
    previous.totalAmount !== current.totalAmount ||
    previous.depositAmount !== current.depositAmount ||
    previous.depositReceived !== current.depositReceived;
}

function collectBookingEvents(previousBookings: Booking[], nextBookings: Booking[]) {
  const previousMap = new Map(previousBookings.map((booking) => [booking.id, booking]));
  const nextMap = new Map(nextBookings.map((booking) => [booking.id, booking]));
  const events: N8nBookingEventPayload[] = [];

  for (const booking of nextBookings) {
    const previous = previousMap.get(booking.id);
    if (!previous) {
      events.push(toBookingEvent("BOOKING_CREATED", booking));
      continue;
    }
    // La cancellazione ha precedenza: se nello stesso aggiornamento arrivano
    // sia caparra che cancellazione, n8n deve ricevere BOOKING_CANCELLED
    // (altrimenti partono automazioni di benvenuto per un ospite cancellato).
    if (previous.status !== "cancelled" && booking.status === "cancelled") {
      events.push(toBookingEvent("BOOKING_CANCELLED", booking));
      continue;
    }
    if (!previous.depositReceived && booking.depositReceived) {
      events.push(toBookingEvent("DEPOSIT_RECEIVED", booking));
      continue;
    }
    if (hasBookingChanged(previous, booking)) {
      events.push(toBookingEvent("BOOKING_MODIFIED", booking));
    }
  }

  for (const booking of previousBookings) {
    if (!nextMap.has(booking.id)) {
      events.push(toBookingEvent("BOOKING_CANCELLED", booking));
    }
  }

  return events;
}

function normalizeDeletedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id).trim()).filter(Boolean);
}

const CAS_MAX_RETRIES = 4;

export async function POST(req: NextRequest) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;

  if (!kvConfigured()) return kvNotConfiguredResponse();

  try {
    const body = (await req.json()) as { bookings: Booking[]; deletedIds?: string[] };
    const incoming = body?.bookings;
    if (!Array.isArray(incoming)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }
    const requestDeletedIds = normalizeDeletedIds(body.deletedIds);

    // CAS retry loop: in caso di scrittura concorrente (operatore + cron Airbnb,
    // due tab, ecc.) si ri-legge il KV e si ri-applica il merge — nessuna
    // modifica viene più sovrascritta in silenzio.
    for (let attempt = 0; attempt < CAS_MAX_RETRIES; attempt++) {
      const deletedIds = new Set(requestDeletedIds);
      const current = await readBookingsKV();
      for (const id of current?.deletedIds ?? []) deletedIds.add(id);
      const existing = ((current?.data ?? []) as Booking[]).filter((booking) => !deletedIds.has(booking.id));
      const mergedMap = new Map(existing.map((booking) => [booking.id, booking]));
      let mergedCount = 0;
      let updatedCount = 0;

      for (const booking of incoming) {
        if (!booking || !booking.id) continue;
        if (deletedIds.has(booking.id)) continue;
        const previous = mergedMap.get(booking.id);
        if (!previous) {
          mergedMap.set(booking.id, booking);
          mergedCount += 1;
          continue;
        }
        if (bookingUpdatedMs(booking) > bookingUpdatedMs(previous)) {
          mergedMap.set(booking.id, { ...previous, ...booking });
          updatedCount += 1;
        }
      }

      const merged = Array.from(mergedMap.values()).sort((a, b) => a.checkIn.localeCompare(b.checkIn));

      const newPayload: KVBookingsPayload = {
        v: (current?.v ?? 0) + 1,
        ts: new Date().toISOString(),
        data: merged,
        deletedIds: capDeletedIds(Array.from(deletedIds)),
      };

      const written = await casWriteBookingsKV(current?.v ?? 0, newPayload);
      if (!written) {
        // Versione cambiata sotto i nostri piedi: retry con dati freschi.
        continue;
      }

      await notifyN8NBookingEvents(
        collectBookingEvents(existing, merged),
        "api/bookings/merge-local"
      );

      return NextResponse.json({
        merged: mergedCount,
        updated: updatedCount,
        total: merged.length,
        v: newPayload.v,
      });
    }

    return NextResponse.json(
      { error: "conflict: troppe scritture concorrenti, riprova" },
      { status: 409 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
