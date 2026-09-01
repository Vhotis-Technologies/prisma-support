import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import { useTicketFlow } from "../app-hooks/useTicketFlow";
import { formatStatus, formatTimestamp, ticketPillClass } from "../lib/format";

export default function TicketDetailPage() {
  const { ticketId = "" } = useParams<{ ticketId: string }>();
  const flow = useTicketFlow(ticketId);
  const {
    ticket,
    updates,
    isLoading,
    isError,
    errorMessage,
    notice,
    clearNotice,
    refetch,
    canComplete,
    requestComplete,
  } = flow;
  const [resolutionNote, setResolutionNote] = useState("");

  if (!ticketId || (isError && !isLoading && !ticket)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/tickets">Tickets</Link>
        </p>
        <h1 className="page-title">Ticket not found</h1>
        <p className="lede">{errorMessage}</p>
        <div className="card-actions">
          <button type="button" className="btn btn-ghost" onClick={refetch}>
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  if (isLoading || !ticket) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/tickets">Tickets</Link>
        </p>
        <h1 className="page-title">Ticket</h1>
        <p className="muted">Loading ticket…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/tickets">Tickets</Link>
        </p>
        <h1 className="page-title">{ticket.subject}</h1>
        <p className="lede">#{ticket.ticket_code}</p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="card">
        <div className="card-row">
          <div>
            <p className="stat-label">Client</p>
            <p className="stat-value">{ticket.client_name}</p>
          </div>
          <span className={ticketPillClass(ticket.status)}>{formatStatus(ticket.status)}</span>
        </div>
        <dl className="meta">
          <div>
            <dt>Opened</dt>
            <dd>{formatTimestamp(ticket.timestamp)}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Description</h2>
        {ticket.description.trim() ? (
          <p>{ticket.description}</p>
        ) : (
          <p className="muted">No description provided.</p>
        )}
      </section>

      <section className="card">
        <h2>Updates</h2>
        {updates.length === 0 ? (
          <p className="muted">No updates yet. Add a note below when you resolve this ticket.</p>
        ) : (
          <ul className="booking-list">
            {updates.map((update) => (
              <li key={update.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{formatStatus(update.status)}</strong>
                  <span className="muted">{formatTimestamp(update.timestamp)}</span>
                </div>
                {update.message ? <p>{update.message}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canComplete ? (
        <section className="card">
          <h2>Resolution note</h2>
          <p className="muted muted--block">
            This message is saved on the ticket timeline and included in the customer email when you
            mark it completed.
          </p>
          <label className="field">
            <span>Message to customer (optional)</span>
            <textarea
              rows={4}
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              placeholder="e.g. We’ve issued a refund — it should appear within 3–5 business days."
              disabled={flow.confirmBusy}
            />
          </label>
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={flow.confirmBusy}
              onClick={() => requestComplete(resolutionNote)}
            >
              Mark as completed
            </button>
          </div>
        </section>
      ) : (
        <section className="card">
          <p className="muted">This ticket is completed.</p>
        </section>
      )}

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
