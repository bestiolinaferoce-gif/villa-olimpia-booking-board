"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (res.ok && data.ok) {
        window.location.href = "/";
        return;
      }
      setError("Password errata. Riprova.");
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: "16px",
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "32px",
          width: "100%",
          maxWidth: "380px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>
          Villa Olimpia — Booking Board
        </h1>
        <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
          Area riservata. Inserisci la password per accedere.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          autoComplete="current-password"
          style={{
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "15px",
            background: "#fff",
            color: "#0f172a",
          }}
        />
        {error && (
          <p style={{ margin: 0, fontSize: "13px", color: "#dc2626" }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || password.length === 0}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: loading ? "#64748b" : "#16a34a",
            color: "#fff",
            fontSize: "15px",
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Accesso in corso…" : "Entra"}
        </button>
      </form>
    </div>
  );
}
