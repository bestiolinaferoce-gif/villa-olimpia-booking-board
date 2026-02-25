"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Conferma",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          style={{ width: "min(440px, 92vw)" }}
        >
          <div className="dialog-header">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="icon-btn" aria-label="Chiudi">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <p style={{ margin: 0 }}>{message}</p>

          <div className="dialog-actions">
            <span />
            <div className="right-actions">
              {onConfirm ? (
                <>
                  <button type="button" className="ghost-btn" onClick={onClose}>
                    Annulla
                  </button>
                  <button type="button" className="primary-btn" onClick={onConfirm}>
                    {confirmLabel}
                  </button>
                </>
              ) : (
                <button type="button" className="primary-btn" onClick={onClose}>
                  Chiudi
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
