"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, X, RefreshCw, ChevronRight } from "lucide-react";
import type { Booking } from "@/lib/types";
import type { BookingConflict } from "@/lib/reconciliation";
import { analyzeBoard, type BoardInsight, type InsightSeverity } from "@/lib/boardInsights";

const SEVERITY_STYLE: Record<
  InsightSeverity,
  { dot: string; bg: string; border: string; label: string }
> = {
  critical: { dot: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Urgente" },
  warning: { dot: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Da gestire" },
  info: { dot: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "Promemoria" },
  success: { dot: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "OK" },
};

const DISMISS_KEY = "vob_assistant_autodismissed_at";

type BoardAssistantProps = {
  bookings: Booking[];
  conflicts: BookingConflict[];
  onOpenBooking: (booking: Booking) => void;
  /** Etichetta del mese mostrato in board (es. "giugno 2026"). */
  monthLabel?: string;
  /** Revenue del mese mostrato in board (stesso valore del KPIPanel, pro-rata notti). */
  monthRevenue?: number;
};

function eur0(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function BoardAssistant({
  bookings,
  conflicts,
  onOpenBooking,
  monthLabel,
  monthRevenue,
}: BoardAssistantProps) {
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [tab, setTab] = useState<"analisi" | "chat">("analisi");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const analysis = useMemo(
    () => analyzeBoard(bookings, conflicts, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings, conflicts, nonce]
  );

  async function sendChat() {
    const text = input.trim();
    if (!text || sending) return;
    setChatError(null);
    const next = [...chat, { role: "user" as const, content: text }];
    setChat(next);
    setInput("");
    setSending(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = process.env.NEXT_PUBLIC_API_WRITE_SECRET;
      if (token) headers["X-Internal-Token"] = token;
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setChatError(data.message || "Assistente non disponibile.");
      } else {
        setChat((c) => [...c, { role: "assistant", content: data.reply as string }]);
      }
    } catch {
      setChatError("Errore di rete verso l'assistente.");
    } finally {
      setSending(false);
    }
  }

  // Auto-apertura all'avvio della board (una volta per giornata) se ci sono azioni.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (analysis.actionsCount === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const last = window.localStorage.getItem(DISMISS_KEY);
    if (last !== today) {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, new Date().toISOString().slice(0, 10));
    }
  }

  const byId = useMemo(() => new Map(bookings.map((b) => [b.id, b])), [bookings]);

  function openFirstBooking(insight: BoardInsight) {
    const id = insight.bookingIds[0];
    if (!id) return;
    const b = byId.get(id);
    if (b) {
      close();
      onOpenBooking(b);
    }
  }

  return (
    <>
      {/* Bottone flottante */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="no-print"
        aria-label="Analisi AI della board"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 900,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "linear-gradient(135deg, #0f2742 0%, #1e3a5f 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "12px 18px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(15,39,66,0.35)",
        }}
      >
        <Sparkles size={16} style={{ color: "#fbbf24" }} />
        Assistente AI
        {analysis.actionsCount > 0 && (
          <span
            style={{
              background: "#dc2626",
              color: "#fff",
              borderRadius: 999,
              minWidth: 20,
              height: 20,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              padding: "0 6px",
            }}
          >
            {analysis.actionsCount}
          </span>
        )}
      </button>

      {/* Pannello */}
      {open && (
        <div
          className="no-print"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.4)",
            zIndex: 1200,
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          <aside
            style={{
              width: "min(440px, 100%)",
              height: "100%",
              background: "#f8fafc",
              boxShadow: "8px 0 40px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <header
              style={{
                background: "linear-gradient(135deg, #0f2742 0%, #1e3a5f 100%)",
                color: "#fff",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={20} style={{ color: "#fbbf24" }} />
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Assistente AI</h2>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    {analysis.actionsCount > 0
                      ? `${analysis.actionsCount} azione${analysis.actionsCount > 1 ? "i" : ""} da gestire`
                      : "Board in ordine"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => setNonce((n) => n + 1)}
                  title="Rianalizza"
                  style={iconBtnStyle}
                >
                  <RefreshCw size={16} />
                </button>
                <button onClick={close} title="Chiudi" style={iconBtnStyle}>
                  <X size={18} />
                </button>
              </div>
            </header>

            {/* Linguette: Analisi (gratis) / Chat AI (Claude) */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
              {(["analisi", "chat"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: tab === t ? "#0f2742" : "#94a3b8",
                    borderBottom: tab === t ? "2px solid #0f2742" : "2px solid transparent",
                  }}
                >
                  {t === "analisi" ? "Analisi" : "Chat AI"}
                </button>
              ))}
            </div>

            {tab === "analisi" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gap: 10 }}>
              {/* Riquadro economico — distingue mese visualizzato vs valore complessivo */}
              <div
                style={{
                  background: "#0f2742",
                  color: "#fff",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "grid",
                  gap: 10,
                }}
              >
                {typeof monthRevenue === "number" && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                      Revenue {monthLabel ?? "mese in corso"} (come da board)
                    </span>
                    <strong style={{ fontSize: 18 }}>{eur0(monthRevenue)}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                    Valore confermato — tutte le date
                  </span>
                  <strong style={{ fontSize: 18 }}>{eur0(analysis.economics.confirmedRevenue)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                    Caparre incassate · Saldo da incassare
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {eur0(analysis.economics.depositsReceived)} · {eur0(analysis.economics.outstanding)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                  Il dato di board è il fatturato del solo mese visualizzato (ripartito per notte). Qui
                  sopra trovi anche il valore complessivo di tutte le prenotazioni confermate.
                </p>
              </div>

              {analysis.insights
                .filter((i) => i.id !== "economia")
                .map((insight) => {
                const s = SEVERITY_STYLE[insight.severity];
                const clickable = insight.bookingIds.length > 0;
                return (
                  <div
                    key={insight.id}
                    style={{
                      background: s.bg,
                      border: `1px solid ${s.border}`,
                      borderRadius: 12,
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          background: s.dot,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                        {insight.title}
                      </span>
                      {insight.amount && insight.amount > 0 ? (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 13,
                            fontWeight: 700,
                            color: s.dot,
                          }}
                        >
                          {new Intl.NumberFormat("it-IT", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0,
                          }).format(insight.amount)}
                        </span>
                      ) : null}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                      {insight.detail}
                    </p>
                    {clickable && (
                      <button
                        onClick={() => openFirstBooking(insight)}
                        style={{
                          marginTop: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "none",
                          border: "none",
                          color: s.dot,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Apri prima prenotazione <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            )}

            {tab === "chat" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gap: 10, alignContent: "start" }}>
                  {chat.length === 0 && (
                    <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                      Chiedimi cosa vuoi sulla board. Esempi:
                      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                        {[
                          "A chi manca la caparra e per quanto?",
                          "Ci sono conflitti da risolvere?",
                          "Riepilogo incassi di questo mese",
                          "Quali check-in ho nei prossimi 7 giorni?",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => setInput(q)}
                            style={{
                              textAlign: "left",
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              borderRadius: 8,
                              padding: "8px 10px",
                              fontSize: 12,
                              color: "#0f2742",
                              cursor: "pointer",
                            }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chat.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: m.role === "user" ? "end" : "start",
                        maxWidth: "85%",
                        background: m.role === "user" ? "#0f2742" : "#fff",
                        color: m.role === "user" ? "#fff" : "#0f172a",
                        border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "9px 12px",
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {m.content}
                    </div>
                  ))}
                  {sending && (
                    <div style={{ color: "#94a3b8", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <RefreshCw size={14} className="spin" /> Sto pensando…
                    </div>
                  )}
                  {chatError && (
                    <div
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#b91c1c",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 12.5,
                        lineHeight: 1.5,
                      }}
                    >
                      {chatError}
                    </div>
                  )}
                </div>
                <div style={{ borderTop: "1px solid #e2e8f0", padding: 12, display: "flex", gap: 8, background: "#fff" }}>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder="Scrivi qui… (Invio per inviare)"
                    rows={2}
                    style={{
                      flex: 1,
                      resize: "none",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 13,
                      fontFamily: "inherit",
                      color: "#0f172a",
                    }}
                  />
                  <button
                    onClick={sendChat}
                    disabled={sending || !input.trim()}
                    style={{
                      background: sending || !input.trim() ? "#cbd5e1" : "#0f2742",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "0 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    Invia
                  </button>
                </div>
              </div>
            )}

            {tab === "analisi" && (
            <footer
              style={{
                padding: "10px 16px",
                borderTop: "1px solid #e2e8f0",
                fontSize: 11,
                color: "#94a3b8",
                textAlign: "center",
              }}
            >
              Analisi generata il{" "}
              {new Date(analysis.generatedAt).toLocaleString("it-IT")}
            </footer>
            )}
          </aside>
          <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  borderRadius: 8,
  width: 32,
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#fff",
};
