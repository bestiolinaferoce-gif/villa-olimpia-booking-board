"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useBookingStore } from "@/lib/store";
import { useShallow } from "zustand/react/shallow";

const TOAST_DURATION_MS = 3500;

export function Toast() {
  const { toast, clearToast } = useBookingStore(
    useShallow((s) => ({ toast: s.toast, clearToast: s.clearToast }))
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(clearToast, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .toast-anim { animation: toast-slide-in 0.25s ease; }
      `}</style>
      <div
        className="toast-anim"
        role="alert"
        aria-live="polite"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 100,
          background: isError ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
          color: isError ? "#b91c1c" : "#15803d",
          borderRadius: "12px",
          padding: "12px 14px",
          maxWidth: "380px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          fontSize: "0.9rem",
          lineHeight: "1.4",
        }}
      >
        <span style={{ flex: 1 }}>{toast.message}</span>
        <button
          type="button"
          onClick={clearToast}
          aria-label="Chiudi notifica"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "inherit",
            opacity: 0.6,
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </>
  );
}
