"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  lodgeStructuralLine,
  quoteLodges,
  quoteThemes,
  type QuoteThemeId,
} from "./quoteConfig";
import { QuoteForm } from "./QuoteForm";
import { QuoteTemplate } from "./QuoteTemplate";
import {
  computeQuote,
  validateQuoteForm,
  type AvailabilityStatus,
  type QuoteFormState,
} from "./quoteUtils";
import "./quotes.css";

const QuotePdfExport = dynamic(
  () => import("./QuotePDF").then((m) => m.QuotePdfExport),
  {
    ssr: false,
    loading: () => (
      <div className="quotes-actions no-print">
        <button
          type="button"
          className="quotes-btn quotes-btn-primary"
          disabled
        >
          Caricamento…
        </button>
      </div>
    ),
  }
);

const initial: QuoteFormState = {
  clientName: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  lodgeId: "Frangipane",
  compareLodgeId: "",
  dailyRate: 0,
  discountPercent: 0,
  includeSanitization: false,
  includePetDomestic: false,
};

type OccupiedRange = { start: string; end: string };

function isOccupied(ranges: OccupiedRange[], checkIn: string, checkOut: string): boolean {
  return ranges.some((r) => r.start < checkOut && r.end > checkIn);
}

export function QuotesPage() {
  const [themeId, setThemeId] = useState<QuoteThemeId>("blu-oro");
  const [state, setState] = useState<QuoteFormState>(initial);
  const templateRef = useRef<HTMLDivElement>(null);
  const [quoteNumber] = useState(
    () => `PREV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
  );
  const issuedAt = useMemo(() => new Date().toISOString(), []);

  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");

  const computed = useMemo(() => computeQuote(state), [state]);
  const formErrors = useMemo(() => validateQuoteForm(state), [state]);
  const hasFormErrors = Object.keys(formErrors).length > 0;

  const lodge =
    quoteLodges.find((l) => l.id === state.lodgeId) ?? quoteLodges[0];
  const lodgeFactsLine = lodgeStructuralLine(lodge);
  const compareLodge =
    state.compareLodgeId && state.compareLodgeId !== state.lodgeId
      ? quoteLodges.find((l) => l.id === state.compareLodgeId)
      : undefined;

  // Verify availability against the booking board calendar on lodge/date change.
  useEffect(() => {
    if (!state.checkIn || !state.checkOut || computed.nights <= 0) {
      setAvailabilityStatus("idle");
      return;
    }
    setAvailabilityStatus("loading");
    let cancelled = false;

    fetch(`/api/public-availability?lodge=${encodeURIComponent(state.lodgeId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{
          ranges: OccupiedRange[] | null;
          lastSyncedAt: string | null;
          error?: string;
        }>;
      })
      .then((data) => {
        if (cancelled) return;

        // ranges: null → API returned 503 / KV hard error
        if (!data.ranges) {
          setAvailabilityStatus("error");
          return;
        }

        // ranges non-empty → data definitely came from KV storage; check collision
        if (data.ranges.length > 0) {
          setAvailabilityStatus(
            isOccupied(data.ranges, state.checkIn, state.checkOut)
              ? "unavailable"
              : "available"
          );
          return;
        }

        // ranges: [] — two distinct cases:
        // 1. KV confirmed empty with a sync timestamp → genuinely available
        // 2. lastSyncedAt: null → KV not configured OR legacy format without ts
        //    → cannot conclude availability; treat as unknown to prevent false positive
        if (data.lastSyncedAt) {
          setAvailabilityStatus("available");
        } else {
          setAvailabilityStatus("unknown");
        }
      })
      .catch(() => {
        if (!cancelled) setAvailabilityStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [state.lodgeId, state.checkIn, state.checkOut, computed.nights]);

  const canExport =
    state.clientName.trim().length > 0 &&
    Boolean(state.checkIn && state.checkOut) &&
    computed.nights > 0 &&
    state.dailyRate > 0 &&
    availabilityStatus === "available" &&
    !hasFormErrors;

  function patch(next: Partial<QuoteFormState>) {
    setState((s) => {
      const merged = { ...s, ...next };
      // Auto-clear compareLodgeId if it equals the (new) primary lodge
      if (merged.compareLodgeId && merged.compareLodgeId === merged.lodgeId) {
        merged.compareLodgeId = "";
      }
      return merged;
    });
  }

  const theme = quoteThemes[themeId] ?? quoteThemes["blu-oro"];
  const themeVars = theme.vars as CSSProperties;

  const exportHints: string[] = [];
  if (!state.clientName.trim()) exportHints.push("inserire il nome cliente");
  if (!state.checkIn || !state.checkOut || computed.nights <= 0)
    exportHints.push("scegliere date valide (check-out dopo check-in, almeno una notte)");
  if (state.dailyRate <= 0)
    exportHints.push("impostare la tariffa giornaliera maggiore di zero");
  if (availabilityStatus === "unavailable")
    exportHints.push("le date selezionate non sono disponibili per questa lodge");
  if (availabilityStatus === "loading")
    exportHints.push("verifica disponibilità in corso — attendere");
  if (availabilityStatus === "unknown")
    exportHints.push(
      "verifica disponibilità non conclusiva — la sorgente dati non conferma con certezza. Contattare il gestore per conferma manuale prima di inviare il preventivo"
    );
  if (availabilityStatus === "error")
    exportHints.push("errore verifica disponibilità — riprovare o cambiare date");
  if (hasFormErrors)
    Object.values(formErrors).forEach((msg) => exportHints.push(msg!));

  return (
    <div className="quotes-page" data-theme={themeId} style={themeVars}>
      <div className="quotes-topbar">
        <Link href="/" className="quotes-back">
          <ArrowLeft size={18} />
          Torna al Booking Board
        </Link>
        <span style={{ fontSize: "0.85rem", color: "var(--q-muted)" }}>
          Modulo Preventivi — uso interno
        </span>
      </div>

      <div className="quotes-layout">
        <div className="quotes-sidebar no-print">
          <QuoteForm
            state={state}
            onChange={patch}
            computed={computed}
            themeId={themeId}
            onThemeChange={setThemeId}
            availabilityStatus={availabilityStatus}
            errors={formErrors}
          />
          {exportHints.length > 0 && (
            <div className="quotes-export-hint no-print" role="status">
              <strong>Per abilitare l&apos;export</strong>
              <ul>
                {exportHints.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}
          <QuotePdfExport targetRef={templateRef} disabled={!canExport} />
        </div>

        <div className="quotes-template-wrap">
          <QuoteTemplate
            ref={templateRef}
            quoteNumber={quoteNumber}
            issuedAt={issuedAt}
            clientName={state.clientName}
            checkIn={state.checkIn}
            checkOut={state.checkOut}
            guests={state.guests}
            lodgeId={lodge.id}
            lodgeName={lodge.name}
            lodgeDescription={lodge.shortDescription}
            lodgeFactsLine={lodgeFactsLine}
            compareLodge={compareLodge}
            includeSanitization={state.includeSanitization}
            computed={computed}
            photoUrl={state.photoUrl}
          />
        </div>
      </div>
    </div>
  );
}
