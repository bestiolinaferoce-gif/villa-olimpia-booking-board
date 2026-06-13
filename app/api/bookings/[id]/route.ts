import { NextRequest, NextResponse } from 'next/server';
import { bookingWriteAuthError, kvNotConfiguredResponse } from '@/lib/bookingsApiAuth';
import type { Booking } from '@/lib/types';
import {
  capDeletedIds,
  casWriteBookingsKV,
  kvConfigured,
  readBookingsKV,
  type KVBookingsPayload,
} from '@/lib/kvCas';

const CAS_MAX_RETRIES = 4;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;
  if (!kvConfigured()) return kvNotConfiguredResponse();
  try {
    const { id } = await params;
    const updates = (await req.json()) as Partial<Booking>;

    for (let attempt = 0; attempt < CAS_MAX_RETRIES; attempt++) {
      const current = (await readBookingsKV()) ?? { v: 0, ts: '', data: [] as Booking[] };
      // Fix P-1: non resuscitare un record già cancellato (tombstone).
      if ((current.deletedIds ?? []).includes(id)) {
        return NextResponse.json(
          { ok: false, error: 'gone', reason: 'Record cancellato (tombstone): non aggiornabile.' },
          { status: 410 }
        );
      }
      const idx = current.data.findIndex((b) => b.id === id);
      if (idx === -1) return NextResponse.json({ ok: false }, { status: 404 });
      const updated: Booking = {
        ...current.data[idx],
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      };
      const newData = [...current.data];
      newData[idx] = updated;
      const newPayload: KVBookingsPayload = {
        v: current.v + 1,
        ts: new Date().toISOString(),
        data: newData,
        deletedIds: current.deletedIds,
      };
      const written = await casWriteBookingsKV(current.v, newPayload);
      if (!written) continue; // scrittura concorrente: retry con dati freschi
      return NextResponse.json({ ok: true, booking: updated, v: newPayload.v });
    }

    return NextResponse.json(
      { ok: false, error: 'conflict: troppe scritture concorrenti, riprova' },
      { status: 409 }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;
  if (!kvConfigured()) return kvNotConfiguredResponse();
  try {
    const { id } = await params;

    for (let attempt = 0; attempt < CAS_MAX_RETRIES; attempt++) {
      const current = (await readBookingsKV()) ?? { v: 0, ts: '', data: [] as Booking[] };
      const newData = current.data.filter((b) => b.id !== id);
      if (newData.length === current.data.length) {
        return NextResponse.json({ ok: false }, { status: 404 });
      }
      const newPayload: KVBookingsPayload = {
        v: current.v + 1,
        ts: new Date().toISOString(),
        data: newData,
        deletedIds: capDeletedIds(Array.from(new Set([...(current.deletedIds ?? []), id]))),
      };
      const written = await casWriteBookingsKV(current.v, newPayload);
      if (!written) continue;
      return NextResponse.json({ ok: true, v: newPayload.v });
    }

    return NextResponse.json(
      { ok: false, error: 'conflict: troppe scritture concorrenti, riprova' },
      { status: 409 }
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
