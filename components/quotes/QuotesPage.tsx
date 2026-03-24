"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useRef, useState } from "react";
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
          Caricamento PDF…
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
  dailyRate: 0,
  discountPercent: 0,
  includeSanitization: false,
  includePetDomestic: false,
};

export function QuotesPage() {
  const [themeId, setThemeId] = useState<QuoteThemeId>("blu-oro");
  const [state, setState] = useState<QuoteFormState>(initial);
  const templateRef = useRef<HTMLDivElement>(null);
  const [quoteNumber] = useState(
    () => `PREV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
  );

  const computed = useMemo(() => computeQuote(state), [state]);
  const lodge =
    quoteLodges.find((l) => l.id === state.lodgeId) ?? quoteLodges[0];
  const lodgeFactsLine = lodgeStructuralLine(lodge);

  const canExport =
    state.clientName.trim().length > 0 &&
    Boolean(state.checkIn && state.checkOut) &&
    computed.nights > 0 &&
    state.dailyRate > 0;

  function patch(next: Partial<QuoteFormState>) {
    setState((s) => ({ ...s, ...next }));
  }

  const theme = quoteThemes[themeId] ?? quoteThemes["blu-oro"];
  const themeVars = theme.vars as CSSProperties;

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
          />
          <QuotePdfExport targetRef={templateRef} disabled={!canExport} />
          {!canExport && (
            <p
              style={{
                marginTop: 12,
                fontSize: "0.82rem",
                color: "var(--q-muted)",
                maxWidth: 380,
              }}
            >
              Compila cliente, date valide (check-out dopo check-in) e tariffa
              giornaliera (maggiore di zero) per abilitare PDF e stampa.
            </p>
          )}
        </div>

        <div className="quotes-template-wrap">
          <QuoteTemplate
            ref={templateRef}
            quoteNumber={quoteNumber}
            clientName={state.clientName}
            checkIn={state.checkIn}
            checkOut={state.checkOut}
            guests={state.guests}
            lodgeName={lodge.name}
            lodgeDescription={lodge.shortDescription}
            lodgeFactsLine={lodgeFactsLine}
            includeSanitization={state.includeSanitization}
            computed={computed}
          />
        </div>
      </div>
    </div>
  );
}
