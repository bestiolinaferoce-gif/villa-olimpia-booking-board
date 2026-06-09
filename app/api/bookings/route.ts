import { NextRequest, NextResponse } from 'next/server';
import { bookingReadAuthError, bookingWriteAuthError, kvNotConfiguredResponse } from '@/lib/bookingsApiAuth';
import type { Booking } from '@/lib/types';
import {
  capDeletedIds,
  casWriteBookingsKV,
  kvConfigured,
  readBookingsKV,
  type KVBookingsPayload,
} from '@/lib/kvCas';
import {
  notifyN8NBookingEvents,
  type N8nBookingEventName,
  type N8nBookingEventPayload,
} from '@/lib/n8nBookingWebhook';

const PROPERTY = 'villa-olimpia';

/** Notti su date-only YYYY-MM-DD in UTC: immune da timezone del server e DST. */
function calculateNights(checkIn: string, checkOut: string) {
  const toUtc = (iso: string): number => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
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
    guestEmail: '',
    guestPhone: '',
    checkin: booking.checkIn,
    checkout: booking.checkOut,
    nights: calculateNights(booking.checkIn, booking.checkOut),
    guests: booking.guestsCount,
    lodge: booking.lodge,
    totalAmount: booking.totalAmount,
    depositAmount: booking.depositAmount,
    depositPaid: booking.depositReceived,
    notes: booking.notes,
    source: 'booking-board',
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
      events.push(toBookingEvent('BOOKING_CREATED', booking));
      continue;
    }
    // La cancellazione ha precedenza sulla caparra (vedi merge-local).
    if (previous.status !== 'cancelled' && booking.status === 'cancelled') {
      events.push(toBookingEvent('BOOKING_CANCELLED', booking));
      continue;
    }
    if (!previous.depositReceived && booking.depositReceived) {
      events.push(toBookingEvent('DEPOSIT_RECEIVED', booking));
      continue;
    }
    if (hasBookingChanged(previous, booking)) {
      events.push(toBookingEvent('BOOKING_MODIFIED', booking));
    }
  }

  for (const booking of previousBookings) {
    if (!nextMap.has(booking.id)) {
      events.push(toBookingEvent('BOOKING_CANCELLED', booking));
    }
  }

  return events;
}

export async function GET(req: NextRequest) {
  const authErr = bookingReadAuthError(req);
  if (authErr) return authErr;

  if (!kvConfigured()) return NextResponse.json({ v: 0, ts: '', data: [] });
  try {
    const payload = await readBookingsKV();
    return NextResponse.json(payload ?? { v: 0, ts: '', data: [] });
  } catch {
    return NextResponse.json({ v: 0, ts: '', data: [] });
  }
}

const CAS_MAX_RETRIES = 4;

export async function POST(req: NextRequest) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;

  if (!kvConfigured()) return kvNotConfiguredResponse();
  try {
    const body = (await req.json()) as Booking[] | { bookings: Booking[]; deletedIds?: string[] };
    const requestedBookings: Booking[] = Array.isArray(body) ? body : (body.bookings ?? []);
    const requestDeletedIds = !Array.isArray(body) && Array.isArray(body.deletedIds) ? body.deletedIds : [];

    for (let attempt = 0; attempt < CAS_MAX_RETRIES; attempt++) {
      const current = await readBookingsKV();
      const deletedIds = Array.from(
        new Set([...(current?.deletedIds ?? []), ...requestDeletedIds])
      );
      const deletedSet = new Set(deletedIds);
      const bookings = requestedBookings.filter((booking) => !deletedSet.has(booking.id));
      const events = collectBookingEvents(current?.data ?? [], bookings);
      const newPayload: KVBookingsPayload = {
        v: (current?.v ?? 0) + 1,
        ts: new Date().toISOString(),
        data: bookings,
        deletedIds: capDeletedIds(deletedIds),
      };
      const written = await casWriteBookingsKV(current?.v ?? 0, newPayload);
      if (!written) continue;

      await notifyN8NBookingEvents(events, 'api/bookings');
      return NextResponse.json({ ok: true, v: newPayload.v, ts: newPayload.ts, syncedEvents: events.length });
    }

    return NextResponse.json(
      { ok: false, error: 'conflict: troppe scritture concorrenti, riprova' },
      { status: 409 }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
