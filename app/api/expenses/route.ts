import { NextRequest, NextResponse } from "next/server";
import { bookingWriteAuthError, kvNotConfiguredResponse } from "@/lib/bookingsApiAuth";
import { normalizeExpenses, type ExpenseItem, type ExpensesPayload } from "@/lib/expenses";

const BASE = process.env.KV_REST_API_URL ?? "";
const TOKEN = process.env.KV_REST_API_TOKEN ?? "";
const KEY = "vob_expenses";

async function readKV(): Promise<ExpensesPayload | null> {
  if (!BASE || !TOKEN) return null;
  const res = await fetch(`${BASE}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("expenses_read_failed");
  const json = (await res.json()) as { result: string | null };
  if (!json.result) return null;
  const parsed = JSON.parse(json.result) as ExpensesPayload | ExpenseItem[];
  if (Array.isArray(parsed)) {
    return { v: 1, ts: new Date().toISOString(), data: normalizeExpenses(parsed) };
  }
  return {
    v: parsed.v ?? 0,
    ts: parsed.ts ?? "",
    data: normalizeExpenses(parsed.data),
  };
}

async function writeKV(payload: ExpensesPayload): Promise<void> {
  const res = await fetch(`${BASE}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([["SET", KEY, JSON.stringify(payload)]]),
  });
  if (!res.ok) throw new Error("expenses_write_failed");
}

export async function GET() {
  if (!BASE || !TOKEN) return NextResponse.json({ v: 0, ts: "", data: [] });
  try {
    const payload = await readKV();
    return NextResponse.json(payload ?? { v: 0, ts: "", data: [] });
  } catch {
    return NextResponse.json({ v: 0, ts: "", data: [] });
  }
}

export async function POST(req: NextRequest) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;

  try {
    const body = (await req.json()) as { expenses?: ExpenseItem[] };
    if (!Array.isArray(body.expenses)) {
      return NextResponse.json({ ok: false, error: "invalid_expenses_payload" }, { status: 400 });
    }
    const expenses = normalizeExpenses(body.expenses);
    if (expenses.length !== body.expenses.length) {
      return NextResponse.json({ ok: false, error: "invalid_expense_item" }, { status: 400 });
    }
    if (!BASE || !TOKEN) return kvNotConfiguredResponse();
    const current = await readKV();
    const payload: ExpensesPayload = {
      v: (current?.v ?? 0) + 1,
      ts: new Date().toISOString(),
      data: expenses,
    };
    await writeKV(payload);
    return NextResponse.json({ ok: true, v: payload.v, ts: payload.ts, total: payload.data.length });
  } catch {
    return NextResponse.json({ ok: false, error: "expenses_write_failed" }, { status: 500 });
  }
}
