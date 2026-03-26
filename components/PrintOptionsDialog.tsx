"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Printer, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  PRINT_SECTIONS_FULL,
  PRINT_SECTIONS_RAPIDA,
  type PrintSections,
} from "@/lib/printConfig";

type Props = {
  open: boolean;
  onClose: () => void;
  initialSections: PrintSections;
  initialLimit: number | null;
  totalBookings: number;
  onConfirmPrint: (sections: PrintSections, limit: number | null) => void;
};

const LABELS: { key: keyof PrintSections; label: string }[] = [
  { key: "anagraficaCompleta", label: "Anagrafica completa cliente" },
  { key: "datiSoggiorno", label: "Dati soggiorno (date, ospiti, animali)" },
  { key: "dettaglioPrenotazione", label: "Dettaglio prenotazione (struttura, lodge, canale, stato, ID)" },
  { key: "riepilogoEconomicoDettagliato", label: "Riepilogo economico dettagliato (extra, pulizie, tassa, note economiche)" },
  { key: "totalePrenotazione", label: "Totale prenotazione (importo principale)" },
  { key: "caparra", label: "Acconto / caparra" },
  { key: "saldo", label: "Saldo residuo" },
  { key: "note", label: "Note" },
];

export function PrintOptionsDialog({ open, onClose, initialSections, initialLimit, totalBookings, onConfirmPrint }: Props) {
  const [sec, setSec] = useState<PrintSections>(initialSections);
  const [limitValue, setLimitValue] = useState<string>(initialLimit ? String(initialLimit) : "");

  useEffect(() => {
    if (open) {
      setSec(initialSections);
      setLimitValue(initialLimit ? String(initialLimit) : "");
    }
  }, [open, initialSections, initialLimit]);

  function toggle<K extends keyof PrintSections>(key: K) {
    setSec((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function applyPreset(p: PrintSections) {
    setSec({ ...p });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content print-options-dialog">
          <div className="dialog-header">
            <Dialog.Title>Opzioni di stampa</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="icon-btn" aria-label="Chiudi">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <p className="print-options-hint">
            Scegli le sezioni da includere. «Completa Carlo» ripristina l&apos;anagrafica e tutti i blocchi come da scheda
            completa.
          </p>
          <div className="print-options-limit">
            <label className="print-options-row" htmlFor="print-limit">
              <span>Numero massimo di schede/pagine da stampare</span>
            </label>
            <input
              id="print-limit"
              type="number"
              min={1}
              max={Math.max(totalBookings, 1)}
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              placeholder={`Tutte (${totalBookings})`}
              className="input"
            />
            <small className="print-options-small">
              Lascia vuoto per stampare tutte le prenotazioni visibili.
            </small>
          </div>
          <div className="print-options-presets">
            <button type="button" className="ghost-btn" onClick={() => applyPreset(PRINT_SECTIONS_RAPIDA)}>
              Stampa rapida
            </button>
            <button type="button" className="ghost-btn primary-active" onClick={() => applyPreset(PRINT_SECTIONS_FULL)}>
              Stampa completa Carlo
            </button>
          </div>
          <div className="print-options-checks">
            {LABELS.map(({ key, label }) => (
              <label key={key} className="print-options-row">
                <input type="checkbox" checked={sec[key]} onChange={() => toggle(key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="dialog-actions">
            <button type="button" className="ghost-btn" onClick={onClose}>
              Annulla
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                const parsed = Number.parseInt(limitValue, 10);
                const nextLimit =
                  Number.isFinite(parsed) && parsed > 0
                    ? Math.min(parsed, Math.max(totalBookings, 1))
                    : null;
                onConfirmPrint({ ...sec }, nextLimit);
              }}
            >
              <Printer size={15} />
              Stampa
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
