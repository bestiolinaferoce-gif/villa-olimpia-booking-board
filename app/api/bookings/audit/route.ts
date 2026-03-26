import { NextResponse } from 'next/server';
import type { Booking } from '@/lib/types';
import { reconcileBookings } from '@/lib/reconciliation';

const BASE = process.env.KV_REST_API_URL ?? '';
const TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const KEY = 'vob_bookings';

type KVPayload = { v: number; ts: string; data: Booking[] };

async function readKV(): Promise<KVPayload> {
  if (!BASE || !TOKEN) return { v: 0, ts: '', data: [] };
  const res = await fetch(`${BASE}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  });
  const json = (await res.json()) as { result: string | null };
  if (!json.result) return { v: 0, ts: '', data: [] };
  const parsed = JSON.parse(json.result) as KVPayload | Booking[];
  if (Array.isArray(parsed)) return { v: 1, ts: '', data: parsed };
  return parsed;
}

export async function GET() {
  if (!BASE || !TOKEN) {
    return NextResponse.json(
      { ok: false, error: 'KV not configured', total: 0, canonical: 0, duplicatesCollapsed: 0, overlapsDetected: 0, conflicts: [] },
      { status: 503 }
    );
  }

  try {
    const payload = await readKV();
    const reconciliation = reconcileBookings(payload.data);

    return NextResponse.json({
      ok: true,
      v: payload.v,
      ts: payload.ts,
      total: payload.data.length,
      canonical: reconciliation.bookings.length,
      duplicatesCollapsed: reconciliation.duplicatesCollapsed,
      overlapsDetected: reconciliation.overlapsDetected,
      conflicts: reconciliation.conflicts,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Audit failed' }, { status: 500 });
  }
}
