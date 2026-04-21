"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Euro,
  Home,
  Image as ImageIcon,
  Loader2,
  Moon,
  Palette,
  PawPrint,
  Percent,
  User,
  Users,
  XCircle,
} from "lucide-react";
import {
  discountOptions,
  lodgeStructuralLine,
  quoteLodges,
  quoteThemeIds,
  quoteThemes,
} from "./quoteConfig";
import type { QuoteThemeId } from "./quoteConfig";
import type {
  AvailabilityStatus,
  FormErrors,
  QuoteComputed,
  QuoteFormState,
} from "./quoteUtils";
import { formatCurrencyEUR, getMaxGuests } from "./quoteUtils";

type QuoteFormProps = {
  state: QuoteFormState;
  onChange: (next: Partial<QuoteFormState>) => void;
  computed: QuoteComputed;
  themeId: QuoteThemeId;
  onThemeChange: (id: QuoteThemeId) => void;
  availabilityStatus: AvailabilityStatus;
  errors: FormErrors;
};

const ic = { display: "inline" as const, verticalAlign: "middle" as const };

function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  if (status === "idle") return null;

  const configs = {
    loading: {
      icon: <Loader2 size={14} style={{ ...ic, animation: "spin 1s linear infinite" }} />,
      text: "Verifica in corso…",
      color: "var(--q-muted)",
    },
    available: {
      icon: <CheckCircle2 size={14} style={ic} />,
      text: "Disponibilità verificata — date libere",
      color: "#4ade80",
    },
    unavailable: {
      icon: <XCircle size={14} style={ic} />,
      text: "Date non disponibili per questa lodge",
      color: "#f87171",
    },
    unknown: {
      icon: <AlertCircle size={14} style={ic} />,
      text: "Verifica non conclusiva — sorgente dati non confermata. Export bloccato: contattare il gestore per conferma manuale.",
      color: "#fbbf24",
    },
    error: {
      icon: <AlertCircle size={14} style={ic} />,
      text: "Errore verifica disponibilità — riprovare o cambiare date",
      color: "#f87171",
    },
  };

  const cfg = configs[status as keyof typeof configs];
  return (
    <p
      className="quotes-hint"
      style={{ color: cfg.color, display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}
    >
      {cfg.icon} {cfg.text}
    </p>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p
      className="quotes-hint"
      role="alert"
      style={{ color: "#f87171", display: "flex", alignItems: "center", gap: 5 }}
    >
      <AlertCircle size={12} style={ic} /> {msg}
    </p>
  );
}

export function QuoteForm({
  state,
  onChange,
  computed,
  themeId,
  onThemeChange,
  availabilityStatus,
  errors,
}: QuoteFormProps) {
  const selectedLodge =
    quoteLodges.find((l) => l.id === state.lodgeId) ?? quoteLodges[0];
  const lodgeFacts = lodgeStructuralLine(selectedLodge);
  const maxGuests = getMaxGuests(state.lodgeId);

  const compareLodgeOptions = quoteLodges.filter((l) => l.id !== state.lodgeId);

  return (
    <div className="quotes-panel">
      <h2>Dati preventivo</h2>

      <div className="quotes-field quotes-theme-row">
        <label htmlFor="q-theme">
          <Palette size={14} style={ic} /> Tema colore
        </label>
        <select
          id="q-theme"
          value={themeId}
          onChange={(e) => onThemeChange(e.target.value as QuoteThemeId)}
        >
          {quoteThemeIds.map((id) => (
            <option key={id} value={id}>
              {quoteThemes[id].label}
            </option>
          ))}
        </select>
      </div>

      <div className="quotes-field">
        <label htmlFor="q-client">
          <User size={14} style={ic} /> Nome cliente
        </label>
        <input
          id="q-client"
          type="text"
          autoComplete="name"
          placeholder="Es. Mario Rossi"
          value={state.clientName}
          onChange={(e) => onChange({ clientName: e.target.value })}
        />
      </div>

      <div className="quotes-field">
        <label htmlFor="q-lodge">
          <Home size={14} style={ic} /> Lodge
        </label>
        <select
          id="q-lodge"
          value={state.lodgeId}
          onChange={(e) =>
            onChange({ lodgeId: e.target.value as QuoteFormState["lodgeId"] })
          }
        >
          {quoteLodges.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {lodgeFacts ? (
          <p className="quotes-hint quotes-lodge-facts">{lodgeFacts}</p>
        ) : null}
      </div>

      <div className="quotes-field">
        <label htmlFor="q-compare">
          <Home size={14} style={ic} /> Confronta con (opzionale)
        </label>
        <select
          id="q-compare"
          value={state.compareLodgeId}
          onChange={(e) =>
            onChange({
              compareLodgeId: e.target.value as QuoteFormState["compareLodgeId"],
            })
          }
        >
          <option value="">Nessun confronto nel documento</option>
          {compareLodgeOptions.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <FieldError msg={errors.compareLodge} />
        <p className="quotes-hint">
          Aggiunge una tabella qualitativa nel PDF; i prezzi restano solo sulla lodge principale.
        </p>
      </div>

      <div className="qt-grid-2 quotes-date-grid">
        <div className="quotes-field" style={{ marginBottom: 0 }}>
          <label htmlFor="q-in">
            <CalendarDays size={14} style={ic} /> Check-in
          </label>
          <input
            id="q-in"
            type="date"
            className="quotes-input-date"
            value={state.checkIn}
            onChange={(e) => onChange({ checkIn: e.target.value })}
          />
        </div>
        <div className="quotes-field" style={{ marginBottom: 0 }}>
          <label htmlFor="q-out">
            <CalendarDays size={14} style={ic} /> Check-out
          </label>
          <input
            id="q-out"
            type="date"
            className="quotes-input-date"
            value={state.checkOut}
            onChange={(e) => onChange({ checkOut: e.target.value })}
          />
        </div>
      </div>
      <AvailabilityBadge status={availabilityStatus} />

      <div className="quotes-field" style={{ marginTop: 14 }}>
        <label htmlFor="q-guests">
          <Users size={14} style={ic} /> Numero ospiti
          {maxGuests !== null && (
            <span style={{ fontWeight: 400, marginLeft: 6, color: "var(--q-muted)" }}>
              (max {maxGuests})
            </span>
          )}
        </label>
        <input
          id="q-guests"
          type="number"
          min={1}
          max={maxGuests ?? 99}
          value={state.guests}
          onChange={(e) =>
            onChange({ guests: parseInt(e.target.value, 10) || 1 })
          }
          style={errors.guests ? { borderColor: "#f87171" } : undefined}
        />
        <FieldError msg={errors.guests} />
      </div>

      <div className="quotes-field">
        <label htmlFor="q-daily">
          <Euro size={14} style={ic} /> Tariffa giornaliera (€ / notte)
        </label>
        <input
          id="q-daily"
          type="number"
          min={0}
          step={0.01}
          value={state.dailyRate || ""}
          onChange={(e) =>
            onChange({ dailyRate: parseFloat(e.target.value) || 0 })
          }
        />
        <p className="quotes-hint">
          Il totale soggiorno viene calcolato automaticamente: notti × tariffa.
        </p>
      </div>

      <div className="quotes-field">
        <label htmlFor="q-discount">
          <Percent size={14} style={ic} /> Sconto sul soggiorno
        </label>
        <select
          id="q-discount"
          value={state.discountPercent}
          onChange={(e) =>
            onChange({
              discountPercent: Number(e.target.value) as 0 | 5 | 10,
            })
          }
        >
          {discountOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <label className="quotes-check">
        <input
          type="checkbox"
          checked={state.includeSanitization}
          onChange={(e) =>
            onChange({ includeSanitization: e.target.checked })
          }
        />
        Extra sanificazione (+ € 50)
      </label>

      <label className="quotes-check">
        <input
          type="checkbox"
          checked={state.includePetDomestic}
          onChange={(e) =>
            onChange({ includePetDomestic: e.target.checked })
          }
        />
        <span>
          <PawPrint size={14} style={{ ...ic, marginRight: 6 }} />
          Presenza animale domestico (cane/gatto) — + € 50
        </span>
      </label>

      <div className="quotes-field">
        <label htmlFor="q-photo">
          <ImageIcon size={14} style={ic} /> Foto lodge (URL, opzionale)
        </label>
        <input
          id="q-photo"
          type="url"
          placeholder="https://… (Cloudinary, Drive, Dropbox…)"
          value={state.photoUrl ?? ""}
          onChange={(e) => onChange({ photoUrl: e.target.value || undefined })}
          style={errors.photoUrl ? { borderColor: "#f87171" } : undefined}
        />
        <FieldError msg={errors.photoUrl} />
        <p className="quotes-hint">Apparirà come immagine di apertura nel preventivo.</p>
      </div>

      <div className="quotes-summary">
        <div className="quotes-summary-row">
          <span>
            <Moon size={14} style={{ verticalAlign: "middle" }} /> Notti
          </span>
          <strong>{computed.nights > 0 ? computed.nights : "—"}</strong>
        </div>
        <div className="quotes-summary-row">
          <span>Tariffa giornaliera (per notte)</span>
          <strong>
            {computed.dailyRate > 0
              ? formatCurrencyEUR(computed.dailyRate)
              : "—"}
          </strong>
        </div>
        <div className="quotes-summary-row quotes-summary-sub">
          <span>
            {computed.nights > 0
              ? `Totale soggiorno: ${computed.nights} notti × ${formatCurrencyEUR(computed.dailyRate)}`
              : "Totale soggiorno (notti × tariffa)"}
          </span>
          <strong>
            {computed.nights > 0
              ? formatCurrencyEUR(computed.stayGross)
              : "—"}
          </strong>
        </div>
        {computed.discountPercent > 0 && (
          <>
            <div className="quotes-summary-row quotes-summary-discount">
              <span>Sconto applicato ({computed.discountPercent}%)</span>
              <strong>−{formatCurrencyEUR(computed.discountAmount)}</strong>
            </div>
            <div className="quotes-summary-row quotes-summary-highlight">
              <span>Totale soggiorno dopo sconto</span>
              <strong>{formatCurrencyEUR(computed.stayAfterDiscount)}</strong>
            </div>
          </>
        )}
        {state.includeSanitization && (
          <div className="quotes-summary-row">
            <span>Extra sanificazione</span>
            <strong>{formatCurrencyEUR(computed.sanitization)}</strong>
          </div>
        )}
        {computed.petEnvironmentFee > 0 && (
          <div className="quotes-summary-row quotes-summary-pet">
            <span>
              <PawPrint size={14} style={{ verticalAlign: "middle" }} />{" "}
              Quota sanificazione ambiente (presenza animale domestico):{" "}
              <strong>{formatCurrencyEUR(computed.petEnvironmentFee)}</strong>
            </span>
          </div>
        )}
        <div className="quotes-summary-row">
          <span>Tassa soggiorno (stima)</span>
          <strong>{formatCurrencyEUR(computed.touristTax)}</strong>
        </div>
        <div className="quotes-summary-row quotes-summary-total">
          <span>Totale finale</span>
          <strong>{formatCurrencyEUR(computed.grandTotal)}</strong>
        </div>
        <div className="quotes-summary-row">
          <span>Acconto ({computed.depositPercent}%)</span>
          <strong>{formatCurrencyEUR(computed.deposit)}</strong>
        </div>
        <div className="quotes-summary-row">
          <span>Saldo al check-in</span>
          <strong>{formatCurrencyEUR(computed.balance)}</strong>
        </div>
      </div>
    </div>
  );
}
