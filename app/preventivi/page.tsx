"use client";

import { useState } from "react";
import { PasswordGate } from "@/components/PasswordGate";
import { QuotesPage } from "@/components/quotes/QuotesPage";
import PremiumQuotePanel from "@/components/quotes/PremiumQuotePanel";

function PremiumButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottone fisso in basso a destra */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1000,
          background: "#92400e",
          color: "#fff",
          border: "none",
          borderRadius: "999px",
          padding: "12px 20px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        }}
      >
        ✨ PDF Premium
      </button>

      {/* Overlay pannello Premium */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1001,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{ width: "100%", maxWidth: "680px" }}>
            <PremiumQuotePanel onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export default function PreventiviPage() {
  return (
    <PasswordGate subtitle="Stessa password del Booking Board — accesso al modulo Preventivi.">
      <QuotesPage />
      <PremiumButton />
    </PasswordGate>
  );
}
