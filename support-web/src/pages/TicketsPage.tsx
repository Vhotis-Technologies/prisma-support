import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useTicketsListFlow } from "../app-hooks/useTicketsListFlow";
import { formatStatus, formatTimestamp, ticketPath, ticketPillClass } from "../lib/format";

export default function TicketsPage() {
  const { searchQuery, setSearchQuery, rows, filtered, queueHint, refreshing, onRefresh } =
    useTicketsListFlow();

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Tickets</h1>
          <p className="lede">
            Customer support requests. Open a ticket to add a resolution note and mark it completed.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={refreshing || rows.status === "loading"}
          onClick={onRefresh}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </section>

      <StatusBanner
        notice={rows.status === "error" ? { type: "error", message: rows.message } : null}
      />

      <div className="toolbar-row">
        <label className="field">
          <span className="visually-hidden">Search tickets</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by code, subject, or client"
            autoComplete="off"
          />
        </label>
        <p className="muted">{queueHint}</p>
      </div>

      {rows.status === "loading" && filtered.length === 0 ? (
        <LoadingLine>Loading tickets…</LoadingLine>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No matches for your search."
              : rows.status === "error"
                ? "Could not load tickets. Retry to try again."
                : "There are no support tickets to show."
          }
          actionLabel={rows.status === "error" ? "Retry" : undefined}
          onAction={rows.status === "error" ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {filtered.map((ticket) => (
            <li key={ticket.id}>
              <Link to={ticketPath(ticket.id)} className="booking-item history-link">
                <div className="booking-item-top">
                  <strong>{ticket.subject}</strong>
                  <span className={ticketPillClass(ticket.status)}>
                    {formatStatus(ticket.status)}
                  </span>
                </div>
                <p>{ticket.client_name}</p>
                <p className="muted">
                  #{ticket.ticket_code} · {formatTimestamp(ticket.timestamp)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
