import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useCrewChatsFlow } from "../app-hooks/useCrewChatsFlow";

export default function CrewChatsPage() {
  const {
    rows,
    threads,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    queueHint,
    refreshing,
    onRefresh,
  } = useCrewChatsFlow();

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Support</p>
          <h1 className="page-title">Crew Chats</h1>
          <p className="lede">
            Real-time support chats with crew members. Click a thread to view the conversation
            and respond.
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
          <span className="visually-hidden">Search crew chats</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by crew name, email, or thread ID"
            autoComplete="off"
          />
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className={statusFilter === "open" ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setStatusFilter("open")}
          >
            Open
          </button>
          <button
            type="button"
            className={statusFilter === "closed" ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setStatusFilter("closed")}
          >
            Closed
          </button>
          <button
            type="button"
            className={statusFilter === "all" ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
        </div>
        <p className="muted">{queueHint}</p>
      </div>

      {rows.status === "loading" && threads.length === 0 ? (
        <LoadingLine>Loading crew chats…</LoadingLine>
      ) : threads.length === 0 ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No matches for your search."
              : rows.status === "error"
                ? "Could not load crew chats. Retry to try again."
                : statusFilter === "open"
                  ? "There are no open crew chats."
                  : statusFilter === "closed"
                    ? "There are no closed crew chats."
                    : "There are no crew chats yet."
          }
          actionLabel={rows.status === "error" ? "Retry" : undefined}
          onAction={rows.status === "error" ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link to={`/crew-chats/${thread.id}`} className="booking-item history-link">
                <div className="booking-item-top">
                  <strong>{thread.crew_name}</strong>
                  <span
                    className={
                      thread.status === "open" ? "pill pill-success" : "pill pill-muted"
                    }
                  >
                    {thread.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
                <p>{thread.crew_email}</p>
                <p className="muted">
                  {formatTimestamp(thread.last_message_at)}
                  {thread.support_unread_count > 0 && (
                    <span
                      style={{
                        marginLeft: "0.5rem",
                        padding: "0.125rem 0.5rem",
                        backgroundColor: "var(--accent)",
                        color: "white",
                        borderRadius: "1rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                      }}
                    >
                      {thread.support_unread_count} unread
                    </span>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
