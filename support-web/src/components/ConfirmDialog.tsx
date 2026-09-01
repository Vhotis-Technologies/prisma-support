import { useEffect, useRef } from "react";
import { useEscapeToClose } from "../app-hooks/useEscapeToClose";
import type { ConfirmRequest } from "../lib/confirm";

type ConfirmDialogProps = ConfirmRequest & {
  busy?: boolean;
  onClose: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Close",
  tone = "primary",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmClass = tone === "danger" ? "btn btn-danger" : "btn btn-primary";

  useEscapeToClose(!busy, onClose);
  useEffect(() => {
    panelRef.current?.focus();
  }, []);
  return (
    <div
      className="dialog-backdrop dialog-backdrop--stacked"
      role="presentation"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="dialog dialog--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="confirm-dialog-title">{title}</h2>
        </div>
        <div className="dialog-body">
          <p className="lede">
            {message}
          </p>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClass}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
