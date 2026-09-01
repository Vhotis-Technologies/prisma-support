import { useEscapeToClose } from "../app-hooks/useEscapeToClose";

type RescheduleDialogProps = {
  title: string;
  hint: string;
  date: string;
  slots: string[];
  selectedSlot: string;
  busy: boolean;
  slotsLoading: boolean;
  submitting: boolean;
  onDateChange: (value: string) => void;
  onSelectSlot: (slot: string) => void;
  onLoadSlots: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function RescheduleDialog({
  title,
  hint,
  date,
  slots,
  selectedSlot,
  busy,
  slotsLoading,
  submitting,
  onDateChange,
  onSelectSlot,
  onLoadSlots,
  onConfirm,
  onClose,
}: RescheduleDialogProps) {
  function close() {
    if (!busy) onClose();
  }
  useEscapeToClose(!busy, close);

  return (
    <div className="dialog-backdrop" role="presentation" onClick={close}>
      <div
        className="dialog dialog--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="reschedule-dialog-title">{title}</h2>
        </div>
        <div className="dialog-body">
          <p className="lede">
            {hint}
          </p>
          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              disabled={busy}
            />
          </label>
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={onLoadSlots}
            >
              {slotsLoading ? "Loading times…" : "Load available times"}
            </button>
          </div>
          {slots.length > 0 ? (
            <div className="slot-grid" role="list">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot-btn${selectedSlot === slot ? " is-selected" : ""}`}
                  onClick={() => onSelectSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <p className="muted">Load times for this date to see available slots.</p>
          )}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" disabled={submitting} onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || !selectedSlot}
            onClick={onConfirm}
          >
            {submitting ? "Saving…" : "Confirm reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
