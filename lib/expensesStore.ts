"use client";

import { create } from "zustand";
import type { Expense, ExpenseInput } from "@/lib/expenses-types";

const STORAGE_KEY = "vob_expenses_local";

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function internalHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.NEXT_PUBLIC_API_WRITE_SECRET;
  if (typeof token === "string" && token.length > 0) {
    headers["X-Internal-Token"] = token;
  }
  return headers;
}

function readLocal(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

type ExpensesState = {
  expenses: Expense[];
  hasHydrated: boolean;
  syncError: boolean;
  loading: boolean;
  load: () => Promise<void>;
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
};

export const useExpensesStore = create<ExpensesState>((set, get) => {
  let persistTimer: ReturnType<typeof setTimeout> | null = null;

  function persist(expenses: Expense[]): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch {
      set({ syncError: true });
    }
    if (persistTimer !== null) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      fetch("/api/expenses", {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({ expenses }),
      })
        .then((r) => set({ syncError: !r.ok }))
        .catch(() => set({ syncError: true }));
    }, 300);
  }

  return {
    expenses: [],
    hasHydrated: false,
    syncError: false,
    loading: false,

    load: async () => {
      // Idratazione immediata da localStorage, poi merge col cloud.
      const local = readLocal();
      set({ expenses: local, hasHydrated: true, loading: true });
      try {
        const res = await fetch("/api/expenses", { cache: "no-store" });
        if (res.ok) {
          const payload = (await res.json()) as { data?: Expense[] };
          const remote = payload.data ?? [];
          // Cloud è la verità: l'app è single-operator, evitiamo merge complessi.
          if (remote.length > 0 || local.length === 0) {
            set({ expenses: remote });
            if (typeof window !== "undefined") {
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
            }
          }
        }
      } catch {
        set({ syncError: true });
      } finally {
        set({ loading: false });
      }
    },

    addExpense: (input) => {
      const now = new Date().toISOString();
      const expense: Expense = { ...input, id: genId(), createdAt: now, updatedAt: now };
      const next = [expense, ...get().expenses];
      set({ expenses: next });
      persist(next);
      return expense;
    },

    updateExpense: (id, input) => {
      const next = get().expenses.map((e) =>
        e.id === id ? { ...e, ...input, id, updatedAt: new Date().toISOString() } : e
      );
      set({ expenses: next });
      persist(next);
    },

    deleteExpense: (id) => {
      const next = get().expenses.filter((e) => e.id !== id);
      set({ expenses: next });
      persist(next);
    },
  };
});
