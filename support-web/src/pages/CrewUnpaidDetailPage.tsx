import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import { useCrewUnpaidFlow } from "../app-hooks/useCrewUnpaidFlow";
import { formatCurrency } from "../lib/format";

export default function CrewUnpaidDetailPage() {
  const { crewMemberId = "" } = useParams<{ crewMemberId: string }>();
  const flow = useCrewUnpaidFlow(crewMemberId);
  const {
    detail,
    isLoading,
    isError,
    errorMessage,
    notice,
    clearNotice,
    refetch,
    requestCreatePayout,
    requestRecordPayment,
  } = flow;
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const notes = { paymentReference, adminNotes };
  const canPay = Boolean(detail && detail.unpaid_job_count > 0);

  if (!crewMemberId || (isError && !isLoading && !detail)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/payouts">Payouts</Link>
        </p>
        <h1 className="page-title">Unpaid earnings not found</h1>
        <p className="lede">{errorMessage}</p>
        <div className="card-actions">
          <button type="button" className="btn btn-ghost" onClick={refetch}>
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  if (isLoading || !detail) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/payouts">Payouts</Link>
        </p>
        <h1 className="page-title">Crew unpaid</h1>
        <p className="muted">Loading unpaid earnings…</p>
      </AppShell>
    );
  }

  const bank = detail.bank_account;

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/payouts">Payouts</Link>
          {" · "}
          Crew unpaid
        </p>
        <h1 className="page-title">{detail.crew_member_name}</h1>
        <p className="lede">{detail.crew_member_email}</p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="card">
        <div className="card-row">
          <div>
            <p className="stat-label">Unpaid</p>
            <p className="stat-value">{formatCurrency(detail.unpaid_amount)}</p>
          </div>
          <span className="pill pill-pending">
            {detail.unpaid_job_count} job{detail.unpaid_job_count === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      <section className="card">
        <h2>Bank account</h2>
        {bank?.has_bank_account ? (
          <dl className="meta meta-2">
            <div>
              <dt>Account name</dt>
              <dd>{bank.account_name || "—"}</dd>
            </div>
            <div>
              <dt>IBAN</dt>
              <dd>{bank.iban_masked || "—"}</dd>
            </div>
            {typeof bank.is_verified === "boolean" ? (
              <div>
                <dt>Verified</dt>
                <dd>{bank.is_verified ? "Yes" : "No"}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="muted">No bank account on file for this crew member.</p>
        )}
      </section>

      <section className="card">
        <h2>Jobs</h2>
        {detail.earnings.length === 0 ? (
          <p className="muted">No unpaid jobs in this breakdown.</p>
        ) : (
          <ul className="booking-list">
            {detail.earnings.map((earning) => (
              <li key={earning.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{earning.job_reference || "Job"}</strong>
                  <span>{formatCurrency(earning.net_amount)}</span>
                </div>
                <p>
                  {earning.client_name}
                  {earning.service_type ? ` · ${earning.service_type}` : ""}
                </p>
                <p className="muted">
                  Gross {formatCurrency(earning.gross_amount)}
                  {earning.created_at_display ? ` · ${earning.created_at_display}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canPay ? (
        <section className="card">
          <h2>Record payment</h2>
          <p className="muted muted--block">
            Record a bank transfer now, or create a pending payout and mark it paid after the
            transfer.
          </p>
          <label className="field">
            <span>Payment reference (optional)</span>
            <input
              type="text"
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder="e.g. CHAPS ref, transaction ID"
              disabled={flow.confirmBusy}
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Admin notes (optional)</span>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              placeholder="Internal note for support records"
              disabled={flow.confirmBusy}
            />
          </label>
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={flow.confirmBusy}
              onClick={() => requestRecordPayment(notes)}
            >
              Payment made
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={flow.confirmBusy}
              onClick={() => requestCreatePayout(notes)}
            >
              Create pending payout
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <p className="muted">There are no unpaid jobs left for this crew member.</p>
        </section>
      )}

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
