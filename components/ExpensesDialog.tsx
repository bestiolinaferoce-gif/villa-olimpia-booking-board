"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, Plus, ReceiptText, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TARGETS,
  EXPENSES_LOCAL_STORAGE_KEY,
  expenseTargetLabel,
  normalizeExpenses,
  type ExpenseCategory,
  type ExpenseInput,
  type ExpenseItem,
  type ExpenseTarget,
  type ExpensesPayload,
} from "@/lib/expenses";

type ExpensesDialogProps = {
  open: boolean;
  onClose: () => void;
};

const EMPTY_FORM: ExpenseInput = {
  target: "villa",
  date: new Date().toISOString().slice(0, 10),
  title: "",
  amount: 0,
  category: "altro",
  note: "",
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  pulizie: "Pulizie",
  manutenzione: "Manutenzione",
  forniture: "Forniture",
  utenze: "Utenze",
  tasse: "Tasse",
  altro: "Altro",
};

function writeHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.NEXT_PUBLIC_API_WRITE_SECRET;
  if (token) headers["X-Internal-Token"] = token;
  return headers;
}

function readLocalExpenses(): ExpenseItem[] {
  try {
    return normalizeExpenses(JSON.parse(localStorage.getItem(EXPENSES_LOCAL_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function saveLocalExpenses(expenses: ExpenseItem[]): void {
  localStorage.setItem(EXPENSES_LOCAL_STORAGE_KEY, JSON.stringify(expenses));
}

function formatEuro(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
}

export function ExpensesDialog({ open, onClose }: ExpensesDialogProps) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [form, setForm] = useState<ExpenseInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetFilter, setTargetFilter] = useState<"all" | ExpenseTarget>("all");
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const local = readLocalExpenses();
    setExpenses(local);
    setLoading(true);
    setError("");
    fetch("/api/expenses", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("cloud_read_failed");
        return response.json() as Promise<ExpensesPayload>;
      })
      .then((payload) => {
        const cloud = normalizeExpenses(payload.data);
        if (!payload.ts && cloud.length === 0 && local.length > 0) {
          setMessage("Modalità locale: archivio cloud non configurato.");
          return;
        }
        setExpenses(cloud);
        saveLocalExpenses(cloud);
      })
      .catch(() => {
        if (local.length > 0) setMessage("Modalità locale: dati cloud non disponibili.");
      })
      .finally(() => setLoading(false));
  }, [open]);

  const visibleExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          (targetFilter === "all" || expense.target === targetFilter) &&
          (!monthFilter || expense.date.startsWith(monthFilter))
      ),
    [expenses, monthFilter, targetFilter]
  );

  const total = useMemo(
    () => visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [visibleExpenses]
  );

  async function persist(next: ExpenseItem[]): Promise<boolean> {
    const normalized = normalizeExpenses(next);
    saveLocalExpenses(normalized);
    setExpenses(normalized);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: writeHeaders(),
        body: JSON.stringify({ expenses: normalized }),
      });
      if (!response.ok) throw new Error("cloud_write_failed");
      setMessage("Spese salvate nel cloud.");
      return true;
    } catch {
      setError("Salvate solo su questo dispositivo: sincronizzazione cloud non riuscita.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const amount = Number(form.amount);
    if (!title) {
      setError("Inserisci una descrizione della spesa.");
      return;
    }
    if (!form.date || !Number.isFinite(amount) || amount <= 0) {
      setError("Data e importo maggiore di zero sono obbligatori.");
      return;
    }
    const now = new Date().toISOString();
    const current = editingId ? expenses.find((expense) => expense.id === editingId) : undefined;
    const item: ExpenseItem = {
      ...form,
      title,
      amount,
      note: form.note.trim(),
      id: current?.id ?? crypto.randomUUID(),
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    const next = current
      ? expenses.map((expense) => (expense.id === current.id ? item : expense))
      : [item, ...expenses];
    await persist(next);
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
  }

  function startEdit(expense: ExpenseItem) {
    setEditingId(expense.id);
    setForm({
      target: expense.target,
      date: expense.date,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      note: expense.note,
    });
    setError("");
    setMessage("");
  }

  async function remove(expense: ExpenseItem) {
    if (!window.confirm(`Eliminare la spesa "${expense.title}"?`)) return;
    await persist(expenses.filter((item) => item.id !== expense.id));
    if (editingId === expense.id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content expenses-dialog">
          <div className="dialog-header">
            <div>
              <Dialog.Title>Gestione spese</Dialog.Title>
              <Dialog.Description>Costi della villa e dei singoli lodge, sincronizzati nel cloud.</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="icon-btn" aria-label="Chiudi">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="expenses-summary">
            <div>
              <span>Totale visualizzato</span>
              <strong>{formatEuro(total)}</strong>
            </div>
            <label>
              Mese
              <input type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} />
            </label>
            <label>
              Destinazione
              <select value={targetFilter} onChange={(event) => setTargetFilter(event.target.value as "all" | ExpenseTarget)}>
                <option value="all">Tutta Villa Olimpia</option>
                {EXPENSE_TARGETS.map((target) => (
                  <option key={target} value={target}>{expenseTargetLabel(target)}</option>
                ))}
              </select>
            </label>
          </div>

          <form className="expenses-form" onSubmit={submit}>
            <label>
              Data
              <input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </label>
            <label>
              Struttura
              <select value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value as ExpenseTarget })}>
                {EXPENSE_TARGETS.map((target) => (
                  <option key={target} value={target}>{expenseTargetLabel(target)}</option>
                ))}
              </select>
            </label>
            <label>
              Categoria
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>
                ))}
              </select>
            </label>
            <label>
              Importo
              <input type="number" min="0.01" step="0.01" required value={form.amount || ""} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
            </label>
            <label className="expenses-form-wide">
              Descrizione
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Es. pulizia appartamento" />
            </label>
            <label className="expenses-form-wide">
              Note
              <textarea rows={2} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </label>
            <div className="expenses-form-actions">
              {editingId && (
                <button type="button" className="ghost-btn" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>
                  Annulla modifica
                </button>
              )}
              <button type="submit" className="primary-btn" disabled={saving}>
                <Plus size={15} />
                {saving ? "Salvataggio…" : editingId ? "Aggiorna spesa" : "Aggiungi spesa"}
              </button>
            </div>
          </form>

          {error && <p className="error-box">{error}</p>}
          {message && <p className="expenses-message">{message}</p>}

          <div className="expenses-list">
            {loading ? (
              <p>Caricamento spese…</p>
            ) : visibleExpenses.length === 0 ? (
              <div className="expenses-empty"><ReceiptText size={24} /><span>Nessuna spesa per i filtri selezionati.</span></div>
            ) : (
              <table>
                <thead>
                  <tr><th>Data</th><th>Voce</th><th>Destinazione</th><th>Categoria</th><th>Importo</th><th /></tr>
                </thead>
                <tbody>
                  {visibleExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.date.split("-").reverse().join("/")}</td>
                      <td><strong>{expense.title}</strong>{expense.note && <small>{expense.note}</small>}</td>
                      <td>{expenseTargetLabel(expense.target)}</td>
                      <td>{CATEGORY_LABELS[expense.category]}</td>
                      <td className="expenses-amount">{formatEuro(expense.amount)}</td>
                      <td className="expenses-row-actions">
                        <button type="button" className="icon-btn" onClick={() => startEdit(expense)} aria-label="Modifica"><Pencil size={14} /></button>
                        <button type="button" className="icon-btn danger-btn" onClick={() => remove(expense)} aria-label="Elimina"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
