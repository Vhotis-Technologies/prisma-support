import { useState, type FormEvent } from "react";
import { useEscapeToClose } from "../app-hooks/useEscapeToClose";
import StatusBanner from "./StatusBanner";
import { loadError } from "../lib/load";
import type { CreateVoucherBody } from "../types/voucher";

type CreateVoucherDialogProps = {
  onCreate: (body: CreateVoucherBody) => Promise<void>;
  onClose: () => void;
};

/** Store calendar date at midday UTC so the intended local day is preserved in ISO. */
function dateInputToStoredIso(ymd: string): string {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
}

export default function CreateVoucherDialog({ onCreate, onClose }: CreateVoucherDialogProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [credit, setCredit] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    if (!submitting) onClose();
  }

  useEscapeToClose(!submitting, close);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const assigned = email.trim().toLowerCase();
    const voucherCode = code.trim().toUpperCase();
    const amount = credit.trim();
    if (!assigned || !voucherCode || !amount) {
      setError("Email, code, and credit amount are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(assigned)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError("Credit must be a number (e.g. 50 or 50.00).");
      return;
    }

    const body: CreateVoucherBody = {
      code: voucherCode,
      assigned_email: assigned,
      credit_amount: amount,
      is_active: isActive,
    };
    if (validFrom) body.valid_from = dateInputToStoredIso(validFrom);
    if (expiresAt) body.expires_at = dateInputToStoredIso(expiresAt);

    setSubmitting(true);
    try {
      await onCreate(body);
      onClose();
    } catch (err: unknown) {
      setError(loadError(err, "Could not create voucher"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={close}>
      <div
        className="dialog dialog--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-voucher-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="create-voucher-title">Create voucher</h2>
        </div>
        <form onSubmit={(event) => void onSubmit(event)}>
          <div className="dialog-body">
            <p className="lede">
              Winner vouchers are linked when the customer signs up with this email, or immediately
              if an account with this email already exists. Codes must be unique.
            </p>
            <StatusBanner notice={error ? { type: "error", message: error } : null} />
            <label className="field">
              <span>Assigned email</span>
              <input
                type="email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="winner@example.com"
                disabled={submitting}
                required
              />
            </label>
            <label className="field">
              <span>Voucher code</span>
              <input
                type="text"
                autoComplete="off"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="e.g. SUMMER2026"
                disabled={submitting}
                required
              />
            </label>
            <label className="field">
              <span>Credit amount (€)</span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={credit}
                onChange={(event) => setCredit(event.target.value)}
                placeholder="e.g. 100"
                disabled={submitting}
                required
              />
            </label>
            <label className="field">
              <span>Valid from (optional)</span>
              <input
                type="date"
                value={validFrom}
                onChange={(event) => setValidFrom(event.target.value)}
                disabled={submitting}
              />
              <p className="field-hint">Leave unset for no start limit.</p>
            </label>
            <label className="field">
              <span>Expires at (optional)</span>
              <input
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                disabled={submitting}
              />
              <p className="field-hint">Leave unset for no expiry.</p>
            </label>
            <div className="pref-row">
              <div>
                <p className="field-label">Active</p>
                <p className="muted">Inactive vouchers cannot be redeemed.</p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={submitting}
                aria-label="Active"
              />
            </div>
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn btn-ghost" disabled={submitting} onClick={close}>
              Close
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
