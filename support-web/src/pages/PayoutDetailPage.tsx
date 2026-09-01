import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import { usePayoutFlow } from "../app-hooks/usePayoutFlow";
import { formatCurrency, payoutPillClass, payoutStatusLabel } from "../lib/format";
import type { PayoutTabKind } from "../types/payout";

function asKind(raw: string | undefined): PayoutTabKind | null {
  if (raw === "partner" || raw === "crew") return raw;
  return null;
}

export default function PayoutDetailPage() {
  const { kind: kindParam, payoutId = "" } = useParams<{ kind: string; payoutId: string }>();
  const kind = asKind(kindParam);
  const flow = usePayoutFlow(kind ? payoutId : "", kind ?? "partner");
  const {
    partner,
    crew,
    isLoading,
    isError,
    errorMessage,
    notice,
    clearNotice,
    refetch,
    canMarkPartnerPaid,
    canMarkCrewPaid,
    requestMarkPartnerPaid,
    requestMarkCrewPaid,
  } = flow;
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  if (!kind || !payoutId || (isError && !isLoading && !partner && !crew)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/payouts">Payouts</Link>
        </p>
        <h1 className="page-title">{kind === "crew" ? "Payment not found" : "Payout not found"}</h1>
        <p className="lede">{kind ? errorMessage : "This payout link is invalid."}</p>
        {kind ? (
          <div className="card-actions">
            <button type="button" className="btn btn-ghost" onClick={refetch}>
              Retry
            </button>
          </div>
        ) : null}
      </AppShell>
    );
  }

  if (isLoading || (!partner && !crew)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/payouts">Payouts</Link>
        </p>
        <h1 className="page-title">Payout</h1>
        <p className="muted">Loading payout…</p>
      </AppShell>
    );
  }

  const title = partner?.partner_name ?? crew?.crew_member_name ?? "Payout";
  const email = partner?.partner_user_email ?? crew?.crew_member_email ?? "";
  const amount = partner?.amount_requested ?? crew?.amount ?? 0;
  const status = partner?.status ?? crew?.status ?? "";
  const isSettled = status === "paid" || status === "completed";
  const notes = { paymentReference, adminNotes };

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/payouts">Payouts</Link>
          {" · "}
          {kind === "crew" ? "Crew" : "Partners"}
        </p>
        <h1 className="page-title">{title}</h1>
        <p className="lede">{email}</p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="card">
        <div className="card-row">
          <div>
            <p className="stat-label">Amount</p>
            <p className="stat-value">{formatCurrency(amount)}</p>
          </div>
          <span className={payoutPillClass(status)}>{payoutStatusLabel(status)}</span>
        </div>
        {isSettled ? (
          <p className="muted">
            {kind === "crew"
              ? "This crew payment has been recorded."
              : "This payout has been marked as paid."}
          </p>
        ) : null}
        {partner?.requested_at_display ? (
          <dl className="meta">
            <div>
              <dt>Requested</dt>
              <dd>{partner.requested_at_display}</dd>
            </div>
          </dl>
        ) : null}
        {crew ? (
          <dl className="meta meta-2">
            <div>
              <dt>Frequency</dt>
              <dd>{crew.pay_frequency_label || "—"}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>
                {crew.period_start_display
                  ? `${crew.period_start_display} – ${crew.period_end_display}`
                  : "—"}
              </dd>
            </div>
            {crew.paid_at_display ? (
              <div>
                <dt>Paid</dt>
                <dd>{crew.paid_at_display}</dd>
              </div>
            ) : null}
            {crew.payout_reference ? (
              <div>
                <dt>Reference</dt>
                <dd>{crew.payout_reference}</dd>
              </div>
            ) : null}
            {crew.admin_notes ? (
              <div>
                <dt>Notes</dt>
                <dd>{crew.admin_notes}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </section>

      {canMarkPartnerPaid || canMarkCrewPaid ? (
        <section className="card">
          <h2>{kind === "crew" ? "Complete crew payment" : "Complete payment"}</h2>
          <p className="muted muted--block">
            {kind === "crew"
              ? "After the bank transfer, mark this payout as paid so the crew app shows completed history."
              : "Record the bank transfer, then mark this payout as paid. The partner will be notified."}
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
              onClick={() =>
                kind === "crew" ? requestMarkCrewPaid(notes) : requestMarkPartnerPaid(notes)
              }
            >
              Mark as paid
            </button>
          </div>
        </section>
      ) : null}

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
