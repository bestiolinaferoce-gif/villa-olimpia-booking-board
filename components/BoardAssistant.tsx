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
};

export function BoardAssistant({ bookings, conflicts, onOpenBooking }: BoardAssistantProps) {
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  const analysis = useMemo(
    () => analyzeBoard(bookings, conflicts, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings, conflicts, nonce]
  );

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

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gap: 10 }}>
              {analysis.insights.map((insight) => {
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
          </aside>
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
