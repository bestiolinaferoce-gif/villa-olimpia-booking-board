import { NextRequest, NextResponse } from "next/server";
import { bookingReadAuthError, bookingWriteAuthError, kvNotConfiguredResponse } from "@/lib/bookingsApiAuth";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TARGETS,
  type Expense,
} from "@/lib/expenses-types";

const BASE = process.env.KV_REST_API_URL ?? "";
const TOKEN = process.env.KV_REST_API_TOKEN ?? "";
const KEY = "vob_expenses";

type KVPayload = { v: number; ts: string; data: Expense[] };

function normalizeExpenses(value: unknown): Expense[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Expense => {
    if (!item || typeof item !== "object") return false;
    const expense = item as Partial<Expense>;
    return Boolean(
      expense.id &&
        expense.description?.trim() &&
        expense.date &&
        /^\d{4}-\d{2}-\d{2}$/.test(expense.date) &&
        expense.target &&
        (EXPENSE_TARGETS as readonly string[]).includes(expense.target) &&
        expense.category &&
        (EXPENSE_CATEGORIES as readonly string[]).includes(expense.category) &&
        Number.isFinite(Number(expense.amount)) &&
        Number(expense.amount) > 0 &&
        Array.isArray(expense.attachments)
    );
  });
}

async function readKV(): Promise<KVPayload> {
  if (!BASE || !TOKEN) return { v: 0, ts: "", data: [] };
  const response = await fetch(`${BASE}/get/${KEY}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("expenses_read_failed");
  const json = (await response.json()) as { result: string | null };
  if (!json.result) return { v: 0, ts: "", data: [] };
  const parsed = JSON.parse(json.result) as KVPayload | Expense[];
  if (Array.isArray(parsed)) return { v: 1, ts: "", data: normalizeExpenses(parsed) };
  return {
    v: parsed.v ?? 0,
    ts: parsed.ts ?? "",
    data: normalizeExpenses(parsed.data),
  };
}

async function writeKV(payload: KVPayload): Promise<void> {
  const response = await fetch(`${BASE}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([["SET", KEY, JSON.stringify(payload)]]),
  });
  if (!response.ok) throw new Error("expenses_write_failed");
}

export async function GET(req: NextRequest) {
  const authErr = bookingReadAuthError(req);
  if (authErr) return authErr;
  if (!BASE || !TOKEN) return NextResponse.json({ v: 0, ts: "", data: [] });
  try {
    return NextResponse.json(await readKV());
  } catch {
    return NextResponse.json({ v: 0, ts: "", data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authErr = bookingWriteAuthError(req);
  if (authErr) return authErr;

  try {
    const body = (await req.json()) as Expense[] | { expenses?: Expense[] };
    const requested = Array.isArray(body) ? body : body.expenses;
    if (!Array.isArray(requested)) {
      return NextResponse.json({ ok: false, error: "invalid_expenses_payload" }, { status: 400 });
    }
    const expenses = normalizeExpenses(requested);
    if (expenses.length !== requested.length) {
      return NextResponse.json({ ok: false, error: "invalid_expense_item" }, { status: 400 });
    }
    if (!BASE || !TOKEN) return kvNotConfiguredResponse();

    const current = await readKV();
    const payload: KVPayload = {
      v: current.v + 1,
      ts: new Date().toISOString(),
      data: expenses,
    };
    await writeKV(payload);
    return NextResponse.json({ ok: true, v: payload.v, ts: payload.ts, total: expenses.length });
  } catch {
    return NextResponse.json({ ok: false, error: "expenses_write_failed" }, { status: 500 });
  }
}
