import { NextRequest, NextResponse } from "next/server";
import { bookingWriteAuthError, kvNotConfiguredResponse } from "@/lib/bookingsApiAuth";
import type { Expense } from "@/lib/expenses-types";

const BASE = process.env.KV_REST_API_URL ?? "";
const TOKEN = process.env.KV_REST_API_TOKEN ?? "";
const KEY = "vob_expenses";

type KVPayload = { v: number; ts: string; data: Expense[] };

/**
 * Protezione lettura: same-origin (browser della board) oppure token interno.
 * Fail-open: senza secret configurato non blocca nulla.
 */
function readAuthError(req: NextRequest): NextResponse | null {
  const secret = (
    process.env.NEXT_PUBLIC_API_WRITE_SECRET ??
    process.env.API_WRITE_SECRET ??
    process.env.CRON_SECRET ??
    ""
  ).trim();
  if (!secret) return null;
  const clientToken = (req.headers.get("x-internal-token") ?? "").trim();
  if (clientToken === secret) return null;
  const host = (req.headers.get("host") ?? "").trim();
  const origin = req.headers.get("origin") ?? "";
  const referer = req.headers.get("referer") ?? "";
  if (host && (origin.includes(host) || referer.includes(host))) return null;
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function readKV(): Promise<KVPayload> {
  if (!BASE || !TOKEN) return { v: 0, ts: "", data: [] };
  const res = await fetch(`${BASE}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  const json = (await res.json()) as { result: string | null };
  if (!json.result) return { v: 0, ts: "", data: [] };
  const parsed = JSON.parse(json.result) as KVPayload | Expense[];
  if (Array.isArray(parsed)) return { v: 1, ts: "", data: parsed };
  return parsed;
}

async function writeKV(payload: KVPayload): Promise<void> {
  await fetch(`${BASE}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([["SET", KEY, JSON.stringify(payload)]]),
  });
}

export async function GET(req: NextRequest) {
  const authErr = readAuthError(req);
  if (authErr) return authErr;
  if (!BASE || !TOKEN) return NextResponse.json({ v: 0, ts: "", data: [] });
  try {
    const payload = await readKV();
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ v: 0, ts: "", data: [] });
  }
}

/**
 * Sostituisce l'intero set di spese (la UI manda sempre lo stato completo,
 * stesso modello del booking store). Atomico lato KV.
 */
export async function POST(req: NextRequest) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;
  if (!BASE || !TOKEN) return kvNotConfiguredResponse();
  try {
    const body = (await req.json()) as Expense[] | { expenses: Expense[] };
    const expenses: Expense[] = Array.isArray(body) ? body : body.expenses ?? [];
    const current = await readKV();
    const newPayload: KVPayload = {
      v: (current.v ?? 0) + 1,
      ts: new Date().toISOString(),
      data: expenses,
    };
    await writeKV(newPayload);
    return NextResponse.json({ ok: true, v: newPayload.v, ts: newPayload.ts });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
