import { NextRequest, NextResponse } from "next/server";
import type { Booking } from "@/lib/types";

/**
 * Export read-only per integrazioni esterne (es. n8n HTTP Request).
 * Non modifica dati. Stessa fonte KV del GET /api/bookings, formato arricchito.
 */
const BASE = process.env.KV_REST_API_URL ?? "";
const TOKEN = process.env.KV_REST_API_TOKEN ?? "";
const KEY = "vob_bookings";

type KVPayload = { v: number; ts: string; data: Booking[] };

async function readKV(): Promise<KVPayload | null> {
  if (!BASE || !TOKEN) return null;
  const res = await fetch(`${BASE}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  const json = (await res.json()) as { result: string | null };
  if (!json.result) return null;
  const parsed = JSON.parse(json.result) as KVPayload | Booking[];
  if (Array.isArray(parsed)) {
    return { v: 1, ts: new Date().toISOString(), data: parsed };
  }
  return parsed as KVPayload;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

export async function GET(req: NextRequest) {
  const apiSecret = process.env.CRON_SECRET ?? "";
  const clientToken =
    req.headers.get("x-internal-token") ?? req.nextUrl.searchParams.get("token") ?? "";

  if (apiSecret && clientToken !== apiSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const exportedAt = new Date().toISOString();
  try {
    const payload = await readKV();
    const bookings = payload?.data ?? [];
    const guests = bookings.map((b) => ({
      bookingId: b.id,
      guestName: b.guestName,
      ...b.guestProfile,
    }));
    const financials = bookings.map((b) => ({
      bookingId: b.id,
      totalAmount: b.totalAmount,
      depositAmount: b.depositAmount,
      depositReceived: b.depositReceived,
      extrasAmount: b.extrasAmount,
      cleaningFee: b.cleaningFee,
      touristTax: b.touristTax,
      economicNotes: b.economicNotes,
    }));
    return NextResponse.json({
      schemaVersion: 1,
      source: "villa-olimpia-booking-board",
      exportedAt,
      kv: payload ? { v: payload.v, ts: payload.ts } : { v: 0, ts: "" },
      bookings,
      guests,
      financials,
      index: bookings.map((b) => ({
        id: b.id,
        lodge: b.lodge,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: nightsBetween(b.checkIn, b.checkOut),
        status: b.status,
        channel: b.channel,
        dataOrigin: b.dataOrigin,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    });
  } catch {
    return NextResponse.json(
      {
        schemaVersion: 1,
        source: "villa-olimpia-booking-board",
        exportedAt,
        error: "export_failed",
        bookings: [],
        guests: [],
        financials: [],
        index: [],
      },
      { status: 500 }
    );
  }
}
