"use client";

import { useState } from "react";

import { quoteLodges } from "@/components/quotes/quoteConfig";

interface PremiumQuotePanelProps {
  /** Callback per nascondere il pannello (es. tornare al form originale) */
  onClose?: () => void;
}

interface FormState {
  lodge_name: string;
  client_name: string;
  checkin: string;
  checkout: string;
  nights: number;
  guests: number;
  daily_rate: number;
  tassa_unit: number;
}

export default function PremiumQuotePanel({ onClose }: PremiumQuotePanelProps) {
  const [form, setForm] = useState<FormState>({
    lodge_name: quoteLodges[0]?.name ?? "Giglio",
    client_name: "",
    checkin: "",
    checkout: "",
    nights: 7,
    guests: 2,
    daily_rate: 145,
    tassa_unit: 2,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setSuccess(false);

    // Validazione client-side
    if (!form.client_name.trim()) {
      setError("Inserisci il nome del cliente");
      return;
    }
    if (!form.checkin || !form.checkout) {
      setError("Inserisci le date di check-in e check-out");
      return;
    }
    if (form.nights < 1) {
      setError("Il numero di notti deve essere almeno 1");
      return;
    }
    if (form.guests < 1) {
      setError("Il numero di ospiti deve essere almeno 1");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/preventivo-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Errore server: ${response.status}`);
      }

      // Scarica il PDF
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const lodgeName = form.lodge_name.replace(/[^a-zA-Z0-9]/g, "_");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Preventivo_VillaOlimpia_${lodgeName}_${today}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-green-900">
            ✨ Preventivo Premium (PDF tipografico)
          </h2>
          <p className="text-sm text-green-700">
            Genera il PDF professionale dal template originale Villa Olimpia
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Chiudi ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Lodge */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Lodge
          </label>
          <select
            value={form.lodge_name}
            onChange={(e) => setForm((p) => ({ ...p, lodge_name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {quoteLodges.map((lodge) => (
              <option key={lodge.id} value={lodge.name}>
                {lodge.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cliente */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome cliente
          </label>
          <input
            type="text"
            placeholder="es. Famiglia Rossi"
            value={form.client_name}
            onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Check-in */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Check-in (es. &quot;5 luglio 2026&quot;)
          </label>
          <input
            type="text"
            placeholder="5 luglio 2026"
            value={form.checkin}
            onChange={(e) => setForm((p) => ({ ...p, checkin: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Check-out */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Check-out (es. &quot;12 luglio 2026&quot;)
          </label>
          <input
            type="text"
            placeholder="12 luglio 2026"
            value={form.checkout}
            onChange={(e) => setForm((p) => ({ ...p, checkout: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Notti */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notti
          </label>
          <input
            type="number"
            min={1}
            value={form.nights}
            onChange={(e) => setForm((p) => ({ ...p, nights: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Ospiti */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Ospiti
          </label>
          <input
            type="number"
            min={1}
            value={form.guests}
            onChange={(e) => setForm((p) => ({ ...p, guests: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Tariffa */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tariffa giornaliera (€)
          </label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={form.daily_rate}
            onChange={(e) => setForm((p) => ({ ...p, daily_rate: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {/* Tassa */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tassa soggiorno (€/persona/notte)
          </label>
          <input
            type="number"
            min={0}
            step={0.50}
            value={form.tassa_unit}
            onChange={(e) => setForm((p) => ({ ...p, tassa_unit: Number(e.target.value) }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Messaggi di stato */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✅ PDF generato e scaricato correttamente
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-green-800 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "⏳ Generazione in corso..." : "📄 Genera PDF Premium"}
      </button>
    </div>
  );
}
