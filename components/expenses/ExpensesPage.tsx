"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Paperclip,
  Trash2,
  Pencil,
  FileText,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { useExpensesStore } from "@/lib/expensesStore";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_GENERAL,
  EXPENSE_PAYMENT_LABELS,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_TARGETS,
  emptyExpenseInput,
  type Expense,
  type ExpenseAttachment,
  type ExpenseCategory,
  type ExpenseInput,
  type ExpenseTarget,
} from "@/lib/expenses-types";

const NAVY = "#0f2742";
const GOLD = "#b45309";
const BORDER = "#e2e8f0";

function eur(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PeriodFilter = "all" | "this_month" | "this_year";

export function ExpensesPage() {
  const { expenses, hasHydrated, load, addExpense, updateExpense, deleteExpense, syncError } =
    useExpensesStore();

  const [targetFilter, setTargetFilter] = useState<ExpenseTarget | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [period, setPeriod] = useState<PeriodFilter>("this_year");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7);
    const yr = String(now.getFullYear());
    return expenses
      .filter((e) => (targetFilter === "all" ? true : e.target === targetFilter))
      .filter((e) => (categoryFilter === "all" ? true : e.category === categoryFilter))
      .filter((e) => {
        if (period === "all") return true;
        if (period === "this_month") return e.date.startsWith(ym);
        return e.date.startsWith(yr);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, targetFilter, categoryFilter, period]);

  const total = useMemo(() => filtered.reduce((s, e) => s + (e.amount || 0), 0), [filtered]);
  const unpaid = useMemo(
    () => filtered.filter((e) => e.paid === false).reduce((s, e) => s + (e.amount || 0), 0),
    [filtered]
  );

  // Breakdown per appartamento (target) — sempre su tutte le voci del periodo selezionato.
  const perTarget = useMemo(() => {
    const periodFiltered = expenses
      .filter((e) => {
        if (period === "all") return true;
        const now = new Date();
        if (period === "this_month") return e.date.startsWith(now.toISOString().slice(0, 7));
        return e.date.startsWith(String(now.getFullYear()));
      });
    const map = new Map<ExpenseTarget, number>();
    for (const t of EXPENSE_TARGETS) map.set(t, 0);
    for (const e of periodFiltered) map.set(e.target, (map.get(e.target) ?? 0) + (e.amount || 0));
    return EXPENSE_TARGETS.map((t) => ({ target: t, total: map.get(t) ?? 0 })).filter(
      (r) => r.total > 0
    );
  }, [expenses, period]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(e: Expense) {
    setEditing(e);
    setFormOpen(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      {/* Header */}
      <header
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #1e3a5f 100%)`,
          color: "#fff",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "rgba(255,255,255,0.85)",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            <ArrowLeft size={16} /> Board
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 0.2 }}>
              Scheda Spese
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              Villa Olimpia · costi per appartamento e struttura
            </p>
          </div>
        </div>
        <button
          onClick={openNew}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: GOLD,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> Nuova spesa
        </button>
      </header>

      {syncError && (
        <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 24px", fontSize: 13 }}>
          ⚠ Sincronizzazione cloud non riuscita — le spese restano salvate sul dispositivo.
        </div>
      )}

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <SummaryCard label="Totale spese (periodo)" value={eur(total)} accent={NAVY} />
          <SummaryCard label="Da pagare" value={eur(unpaid)} accent={unpaid > 0 ? "#b91c1c" : "#16a34a"} />
          <SummaryCard label="Voci registrate" value={String(filtered.length)} accent={GOLD} />
        </div>

        {/* Filtri */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <Select
            value={period}
            onChange={(v) => setPeriod(v as PeriodFilter)}
            options={[
              { value: "this_month", label: "Questo mese" },
              { value: "this_year", label: "Quest'anno" },
              { value: "all", label: "Tutte" },
            ]}
          />
          <Select
            value={targetFilter}
            onChange={(v) => setTargetFilter(v as ExpenseTarget | "all")}
            options={[
              { value: "all", label: "Tutti gli appartamenti" },
              ...EXPENSE_TARGETS.map((t) => ({ value: t, label: t })),
            ]}
          />
          <Select
            value={categoryFilter}
            onChange={(v) => setCategoryFilter(v as ExpenseCategory | "all")}
            options={[
              { value: "all", label: "Tutte le categorie" },
              ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: EXPENSE_CATEGORY_LABELS[c] })),
            ]}
          />
        </div>

        {/* Breakdown per appartamento */}
        {perTarget.length > 0 && (
          <section
            style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 16,
              marginBottom: 22,
            }}
          >
            <h2 style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
              SPESA PER APPARTAMENTO
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {perTarget.map((r) => (
                <button
                  key={r.target}
                  onClick={() => setTargetFilter(r.target)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    border: `1px solid ${targetFilter === r.target ? NAVY : BORDER}`,
                    background: targetFilter === r.target ? "rgba(15,39,66,0.05)" : "#fff",
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    minWidth: 120,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    {r.target === EXPENSE_GENERAL ? "Struttura (generale)" : r.target}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{eur(r.total)}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Lista spese */}
        <section
          style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}
        >
          {!hasHydrated ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Caricamento…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8" }}>
              <FileText size={28} style={{ opacity: 0.4 }} />
              <p style={{ margin: "10px 0 0", fontSize: 14 }}>
                Nessuna spesa in questo periodo. Premi “Nuova spesa” per iniziare.
              </p>
            </div>
          ) : (
            <div>
              {filtered.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ width: 70, fontSize: 12, color: "#64748b" }}>{fmtDate(e.date)}</div>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {e.description || EXPENSE_CATEGORY_LABELS[e.category]}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: e.target === EXPENSE_GENERAL ? "#f1f5f9" : "rgba(15,39,66,0.07)",
                          color: NAVY,
                          borderRadius: 6,
                          padding: "1px 7px",
                          fontWeight: 600,
                        }}
                      >
                        {e.target === EXPENSE_GENERAL ? "Generale" : e.target}
                      </span>
                      <span>{EXPENSE_CATEGORY_LABELS[e.category]}</span>
                      {e.supplier ? <span>· {e.supplier}</span> : null}
                      {e.paid === false ? (
                        <span style={{ color: "#b91c1c", fontWeight: 600 }}>· DA PAGARE</span>
                      ) : null}
                    </div>
                  </div>
                  {e.attachments.length > 0 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {e.attachments.map((a, idx) => (
                        <a
                          key={idx}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          title={a.name}
                          style={{ color: GOLD, display: "inline-flex" }}
                        >
                          <Paperclip size={15} />
                        </a>
                      ))}
                    </div>
                  )}
                  <div style={{ width: 96, textAlign: "right", fontSize: 14, fontWeight: 700 }}>
                    {eur(e.amount)}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IconBtn title="Modifica" onClick={() => openEdit(e)}>
                      <Pencil size={15} />
                    </IconBtn>
                    <IconBtn
                      title="Elimina"
                      onClick={() => {
                        if (confirm("Eliminare questa spesa?")) deleteExpense(e.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {formOpen && (
        <ExpenseForm
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSave={(input) => {
            if (editing) updateExpense(editing.id, input);
            else addExpense(input);
            setFormOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: "14px 16px",
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent }}>{value}</div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: "#f1f5f9",
        border: "none",
        borderRadius: 8,
        width: 30,
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "#475569",
      }}
    >
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "8px 10px",
        fontSize: 13,
        background: "#fff",
        color: "#0f172a",
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Form spesa (modal)
// ---------------------------------------------------------------------------

function ExpenseForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Expense | null;
  onClose: () => void;
  onSave: (input: ExpenseInput) => void;
}) {
  const [form, setForm] = useState<ExpenseInput>(() =>
    initial
      ? {
          date: initial.date,
          target: initial.target,
          category: initial.category,
          description: initial.description,
          amount: initial.amount,
          paymentMethod: initial.paymentMethod,
          supplier: initial.supplier,
          paid: initial.paid,
          notes: initial.notes,
          attachments: initial.attachments ?? [],
        }
      : emptyExpenseInput()
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof ExpenseInput>(key: K, val: ExpenseInput[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded: ExpenseAttachment[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const headers: Record<string, string> = {};
        const token = process.env.NEXT_PUBLIC_API_WRITE_SECRET;
        if (token) headers["X-Internal-Token"] = token;
        const res = await fetch("/api/expenses/upload", { method: "POST", headers, body: fd });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setUploadError(data.message || "Upload non riuscito.");
          continue;
        }
        uploaded.push(data.attachment as ExpenseAttachment);
      }
      if (uploaded.length > 0) {
        set("attachments", [...form.attachments, ...uploaded]);
      }
    } catch {
      setUploadError("Errore durante l'upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeAttachment(idx: number) {
    set(
      "attachments",
      form.attachments.filter((_, i) => i !== idx)
    );
  }

  const canSave = form.description.trim().length > 0 || form.amount > 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "5vh 16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 560,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: NAVY }}>
            {initial ? "Modifica spesa" : "Nuova spesa"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20, display: "grid", gap: 14 }}>
          <Row>
            <Field label="Data">
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Importo (€)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.amount || ""}
                onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                style={inputStyle}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Appartamento / struttura">
              <select
                value={form.target}
                onChange={(e) => set("target", e.target.value as ExpenseTarget)}
                style={inputStyle}
              >
                {EXPENSE_TARGETS.map((t) => (
                  <option key={t} value={t}>
                    {t === EXPENSE_GENERAL ? "Generale (struttura)" : t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Categoria">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value as ExpenseCategory)}
                style={inputStyle}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {EXPENSE_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </Field>
          </Row>

          <Field label="Descrizione">
            <input
              type="text"
              value={form.description}
              placeholder="Es. Sostituzione boiler, fornitura asciugamani…"
              onChange={(e) => set("description", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Row>
            <Field label="Fornitore">
              <input
                type="text"
                value={form.supplier ?? ""}
                onChange={(e) => set("supplier", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Pagamento">
              <select
                value={form.paymentMethod ?? "bonifico"}
                onChange={(e) => set("paymentMethod", e.target.value as ExpenseInput["paymentMethod"])}
                style={inputStyle}
              >
                {EXPENSE_PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {EXPENSE_PAYMENT_LABELS[m]}
                  </option>
                ))}
              </select>
            </Field>
          </Row>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={form.paid !== false}
              onChange={(e) => set("paid", e.target.checked)}
            />
            Spesa già pagata
          </label>

          <Field label="Note">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          {/* Allegati */}
          <Field label="Documenti (fatture, scontrini, ricevute — qualsiasi formato)">
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: `1px dashed ${GOLD}`,
                background: "rgba(180,83,9,0.05)",
                color: GOLD,
                borderRadius: 8,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: uploading ? "wait" : "pointer",
              }}
            >
              {uploading ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
              {uploading ? "Caricamento…" : "Allega documento"}
            </button>
            {uploadError && (
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#b91c1c" }}>{uploadError}</p>
            )}
            {form.attachments.length > 0 && (
              <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                {form.attachments.map((a, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#f8fafc",
                      border: `1px solid ${BORDER}`,
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 13,
                    }}
                  >
                    <Paperclip size={14} style={{ color: GOLD }} />
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, color: NAVY, textDecoration: "none" }}
                    >
                      {a.name}
                    </a>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{fileSize(a.size)}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            padding: "14px 20px",
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              cursor: "pointer",
              color: "#475569",
            }}
          >
            Annulla
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!canSave}
            style={{
              background: canSave ? NAVY : "#cbd5e1",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            Salva spesa
          </button>
        </div>
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: "9px 11px",
  fontSize: 14,
  width: "100%",
  background: "#fff",
  color: "#0f172a",
  boxSizing: "border-box",
};
