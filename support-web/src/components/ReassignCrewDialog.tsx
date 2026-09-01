import { useEscapeToClose } from "../app-hooks/useEscapeToClose";
import type { ReassignFlow } from "../app-hooks/useReassignFlow";
import { initials } from "../lib/format";
import StatusBanner from "./StatusBanner";

type ReassignCrewDialogProps = {
  flow: ReassignFlow;
};

export default function ReassignCrewDialog({ flow }: ReassignCrewDialogProps) {
  const {
    visible,
    close,
    isLoading,
    isSubmitting,
    candidates,
    requirement,
    reasonCode,
    setReasonCode,
    reasonNotes,
    setReasonNotes,
    selectedIds,
    toggleCandidate,
    submit,
    canSubmit,
    reasons,
    error,
  } = flow;

  useEscapeToClose(visible && !isSubmitting, close);

  if (!visible) return null;

  const hint = requirement?.is_bulk
    ? `Replace the team across ${requirement.job_count} vehicles. Pick at least one — extras spread the load.`
    : requirement?.is_express
      ? "Express jobs require two replacement detailers."
      : "Pick one replacement detailer free for this slot.";

  const selectedHint = requirement
    ? requirement.is_bulk
      ? `${selectedIds.length} selected`
      : `${selectedIds.length}/${requirement.required_count}`
    : "";

  return (
    <div className="dialog-backdrop" role="presentation" onClick={close}>
      <div
        className="dialog dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reassign-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-header">
          <h2 id="reassign-dialog-title">Reassign crew</h2>
        </div>
        <div className="dialog-body">
          <p className="lede">
            {hint}
          </p>
          <StatusBanner notice={error ? { type: "error", message: error } : null} />

          <p className="field-label">Reason</p>
          <div className="chip-row" role="group" aria-label="Reassignment reason">
            {reasons.map((reason) => (
              <button
                key={reason.code}
                type="button"
                className={`photo-tab${reason.code === reasonCode ? " is-selected" : ""}`}
                onClick={() => setReasonCode(reason.code)}
              >
                {reason.label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Notes (optional)</span>
            <textarea
              rows={3}
              value={reasonNotes}
              onChange={(event) => setReasonNotes(event.target.value)}
              disabled={isSubmitting}
              placeholder="Context for this reassignment…"
            />
          </label>

          <div className="card-row">
            <p className="field-label">
              Available detailers{selectedHint ? ` · ${selectedHint}` : ""}
            </p>
            {isLoading ? <span className="muted">Looking for replacements…</span> : null}
          </div>

          {isLoading && candidates.length === 0 ? (
            <p className="muted">Looking for replacements…</p>
          ) : candidates.length === 0 ? (
            <p className="muted">
              No detailers are free for this slot. Try rescheduling first or contact crew ops.
            </p>
          ) : (
            <ul className="candidate-list">
              {candidates.map((candidate) => {
                const selected = selectedIds.includes(candidate.id);
                return (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      className={`candidate-row${selected ? " is-selected" : ""}`}
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <span className="avatar">{initials(candidate.name)}</span>
                      <span>
                        <strong>{candidate.name}</strong>
                        <span className="muted muted--block">
                          {candidate.phone || candidate.email || "No contact info"}
                          {candidate.rating > 0 ? ` · ${candidate.rating.toFixed(1)}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" disabled={isSubmitting} onClick={close}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canSubmit || isSubmitting}
            onClick={submit}
          >
            {isSubmitting ? "Saving…" : "Reassign crew"}
          </button>
        </div>
      </div>
    </div>
  );
}
