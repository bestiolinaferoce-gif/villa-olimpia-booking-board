import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.KV_REST_API_URL ?? '';
const TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const KEY = 'vob_bookings';

export async function GET() {
  if (!BASE || !TOKEN) return NextResponse.json([]);
  try {
    const res = await fetch(`${BASE}/get/${KEY}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store',
    });
    const json = (await res.json()) as { result: string | null };
    return NextResponse.json(json.result ? JSON.parse(json.result) : []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  if (!BASE || !TOKEN) return NextResponse.json({ ok: false });
  try {
    const bookings = await req.json();
    await fetch(`${BASE}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([['SET', KEY, JSON.stringify(bookings)]]),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
