import { LODGES, type Lodge } from "@/lib/types";

export type ExpenseTarget = "villa" | Lodge;

export const EXPENSE_TARGETS: readonly ExpenseTarget[] = ["villa", ...LODGES] as const;

export const EXPENSE_CATEGORIES = [
  "pulizie",
  "manutenzione",
  "forniture",
  "utenze",
  "tasse",
  "altro",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type ExpenseItem = {
  id: string;
  target: ExpenseTarget;
  date: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseInput = Omit<ExpenseItem, "id" | "createdAt" | "updatedAt">;

export type ExpensesPayload = {
  v: number;
  ts: string;
  data: ExpenseItem[];
};

export const EXPENSES_LOCAL_STORAGE_KEY = "villa-olimpia-booking-board:expenses:v1";

export const expenseTargetLabel = (target: ExpenseTarget): string =>
  target === "villa" ? "Villa Olimpia" : target;

export function normalizeExpenses(value: unknown): ExpenseItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ExpenseItem => {
      if (!item || typeof item !== "object") return false;
      const maybe = item as Partial<ExpenseItem>;
      return Boolean(
          maybe.id &&
          maybe.date &&
          maybe.title &&
          /^\d{4}-\d{2}-\d{2}$/.test(maybe.date) &&
          maybe.target &&
          (EXPENSE_TARGETS as readonly string[]).includes(maybe.target) &&
          maybe.category &&
          (EXPENSE_CATEGORIES as readonly string[]).includes(maybe.category) &&
          Number.isFinite(Number(maybe.amount)) &&
          Number(maybe.amount) > 0
      );
    })
    .map((expense) => ({
      ...expense,
      title: String(expense.title).trim().slice(0, 160),
      amount: Math.round(Number(expense.amount) * 100) / 100,
      note: String(expense.note ?? ""),
      createdAt: expense.createdAt || new Date().toISOString(),
      updatedAt: expense.updatedAt || expense.createdAt || new Date().toISOString(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
}
