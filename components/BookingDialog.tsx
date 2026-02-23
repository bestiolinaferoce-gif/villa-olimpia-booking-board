"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BOOKING_CHANNELS, BOOKING_STATUSES, LODGES, type Booking, type BookingInput, type BookingStatus, type Lodge } from "@/lib/types";

type BookingDialogProps = {
  open: boolean;
  booking: Booking | null;
  initialLodge?: Lodge;
  initialDate?: string;
  onClose: () => void;
  onCreate: (payload: BookingInput) => void;
  onUpdate: (id: string, payload: BookingInput) => void;
  onDelete: (id: string) => void;
};

type FormState = BookingInput;

function buildDefault(lodge?: Lodge, day?: string): FormState {
  const checkIn = day || new Date().toISOString().slice(0, 10);
  return {
    guestName: "",
    lodge: lodge || LODGES[0],
    checkIn,
    checkOut: new Date(new Date(checkIn).setDate(new Date(checkIn).getDate() + 1)).toISOString().slice(0, 10),
    status: "confirmed",
    channel: "direct",
    notes: "",
    totalAmount: 0,
    depositAmount: 0,
    depositReceived: false,
  };
}

export function BookingDialog({
  open,
  booking,
  initialLodge,
  initialDate,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: BookingDialogProps) {
  const mode = booking ? "edit" : "create";
  const [form, setForm] = useState<FormState>(buildDefault(initialLodge, initialDate));
  const [error, setError] = useState("");

  const title = useMemo(() => (mode === "edit" ? "Modifica prenotazione" : "Nuova prenotazione"), [mode]);

  useEffect(() => {
    if (booking) {
      setForm({
        guestName: booking.guestName,
        lodge: booking.lodge,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status,
        channel: booking.channel,
        notes: booking.notes,
        totalAmount: booking.totalAmount,
        depositAmount: booking.depositAmount,
        depositReceived: booking.depositReceived,
      });
      setError("");
      return;
    }
    setForm(buildDefault(initialLodge, initialDate));
    setError("");
  }, [booking, open, initialLodge, initialDate]);

  function submit() {
    try {
      if (mode === "edit" && booking) {
        onUpdate(booking.id, form);
      } else {
        onCreate(form);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore durante il salvataggio.");
    }
  }

  function change<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-header">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="icon-btn" aria-label="Chiudi">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="form-grid">
            <label>
              Ospite
              <input value={form.guestName} onChange={(e) => change("guestName", e.target.value)} placeholder="Nome e cognome" />
            </label>
            <label>
              Lodge
              <select value={form.lodge} onChange={(e) => change("lodge", e.target.value as Lodge)}>
                {LODGES.map((lodge) => (
                  <option key={lodge} value={lodge}>
                    {lodge}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Check-in
              <input type="date" value={form.checkIn} onChange={(e) => change("checkIn", e.target.value)} />
            </label>
            <label>
              Check-out
              <input type="date" value={form.checkOut} onChange={(e) => change("checkOut", e.target.value)} />
            </label>
            <label>
              Stato
              <select value={form.status} onChange={(e) => change("status", e.target.value as BookingStatus)}>
                {BOOKING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Canale
              <select value={form.channel} onChange={(e) => change("channel", e.target.value as BookingInput["channel"])}>
                {BOOKING_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Totale
              <input
                type="number"
                min={0}
                value={form.totalAmount}
                onChange={(e) => change("totalAmount", Number(e.target.value || 0))}
              />
            </label>
            <label>
              Caparra
              <input
                type="number"
                min={0}
                value={form.depositAmount}
                onChange={(e) => change("depositAmount", Number(e.target.value || 0))}
              />
            </label>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={form.depositReceived}
                onChange={(e) => change("depositReceived", e.target.checked)}
              />
              Caparra ricevuta
            </label>
            <label className="full-width">
              Note
              <textarea value={form.notes} onChange={(e) => change("notes", e.target.value)} rows={4} />
            </label>
          </div>

          {error ? <p className="error-box">{error}</p> : null}

          <div className="dialog-actions">
            {mode === "edit" && booking ? (
              <button
                type="button"
                className="danger-btn"
                onClick={() => {
                  onDelete(booking.id);
                  onClose();
                }}
              >
                Elimina
              </button>
            ) : (
              <span />
            )}
            <div className="right-actions">
              <button type="button" className="ghost-btn" onClick={onClose}>
                Annulla
              </button>
              <button type="button" className="primary-btn" onClick={submit}>
                Salva
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
