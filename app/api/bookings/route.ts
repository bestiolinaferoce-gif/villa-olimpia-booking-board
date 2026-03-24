import { NextRequest, NextResponse } from 'next/server';
import type { Booking } from '@/lib/types';

const BASE = process.env.KV_REST_API_URL ?? '';
const TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const KEY = 'vob_bookings';

type KVPayload = { v: number; ts: string; data: Booking[] };


const PROPERTY = 'villa-olimpia';
const N8N_BOOKING_WEBHOOK_URL = process.env.N8N_BOOKING_WEBHOOK_URL ?? '';
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET ?? '';

type BookingEventName = 'BOOKING_CREATED' | 'BOOKING_MODIFIED' | 'BOOKING_CANCELLED' | 'DEPOSIT_RECEIVED';

type BookingEventPayload = {
  event: BookingEventName;
  bookingId: string;
  property: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkin: string;
  checkout: string;
  nights: number;
  guests: number;
  lodge: string;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  notes: string;
  source: 'booking-board';
};

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function toBookingEvent(event: BookingEventName, booking: Booking): BookingEventPayload {
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
  const events: BookingEventPayload[] = [];

  for (const booking of nextBookings) {
    const previous = previousMap.get(booking.id);
    if (!previous) {
      events.push(toBookingEvent('BOOKING_CREATED', booking));
      continue;
    }
    if (!previous.depositReceived && booking.depositReceived) {
      events.push(toBookingEvent('DEPOSIT_RECEIVED', booking));
      continue;
    }
    if (previous.status !== 'cancelled' && booking.status === 'cancelled') {
      events.push(toBookingEvent('BOOKING_CANCELLED', booking));
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

async function notifyN8N(events: BookingEventPayload[]) {
  if (!N8N_BOOKING_WEBHOOK_URL || events.length === 0) return;
  await Promise.allSettled(events.map((event) =>
    fetch(N8N_BOOKING_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(event),
    })
  ));
}

async function readKV(): Promise<{ payload: KVPayload | null; raw: string | null }> {
  if (!BASE || !TOKEN) return { payload: null, raw: null };
  const res = await fetch(`${BASE}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });
  const json = (await res.json()) as { result: string | null };
  if (!json.result) return { payload: null, raw: null };
  const parsed = JSON.parse(json.result) as KVPayload | Booking[];
  if (Array.isArray(parsed)) {
    return { payload: { v: 1, ts: new Date().toISOString(), data: parsed }, raw: json.result };
  }
  return { payload: parsed as KVPayload, raw: json.result };
}

export async function GET() {
  if (!BASE || !TOKEN) return NextResponse.json({ v: 0, ts: '', data: [] });
  try {
    const { payload } = await readKV();
    return NextResponse.json(payload ?? { v: 0, ts: '', data: [] });
  } catch {
    return NextResponse.json({ v: 0, ts: '', data: [] });
  }
}

export async function POST(req: NextRequest) {
  if (!BASE || !TOKEN) return NextResponse.json({ ok: false });
  try {
    const body = (await req.json()) as Booking[] | { bookings: Booking[] };
    const bookings: Booking[] = Array.isArray(body) ? body : (body.bookings ?? []);
    const { payload: current } = await readKV();
    const events = collectBookingEvents(current?.data ?? [], bookings);
    const newPayload: KVPayload = {
      v: (current?.v ?? 0) + 1,
      ts: new Date().toISOString(),
      data: bookings,
    };
    await fetch(`${BASE}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['SET', KEY, JSON.stringify(newPayload)]]),
    });
    await notifyN8N(events);
    return NextResponse.json({ ok: true, v: newPayload.v, ts: newPayload.ts, syncedEvents: events.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
