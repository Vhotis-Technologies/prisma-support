/**
 * Confirm-dialog payload owned by page hooks (not by the dialog component).
 * `onConfirm` runs the mutation; the page passes `busy` while it is in flight.
 */
export type ConfirmTone = "primary" | "danger" | "warning";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
};
