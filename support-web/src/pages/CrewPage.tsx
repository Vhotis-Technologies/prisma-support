import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useCrewListFlow } from "../app-hooks/useCrewListFlow";

export default function CrewPage() {
  const { searchQuery, setSearchQuery, rows, filtered, queueHint, refreshing, onRefresh } =
    useCrewListFlow();

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Prisma Crew</h1>
          <p className="lede">
            Search detailers, then open a profile to verify or deactivate them.
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
          <span className="visually-hidden">Search crew</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, phone, or email"
            autoComplete="off"
          />
        </label>
        <p className="muted">
          {queueHint}
        </p>
      </div>

      {rows.status === "loading" && filtered.length === 0 ? (
        <LoadingLine>Loading crew…</LoadingLine>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No matches for your search."
              : rows.status === "error"
                ? "Could not load crew. Retry to try again."
                : "When detailers join, they will appear here."
          }
          actionLabel={rows.status === "error" ? "Retry" : undefined}
          onAction={rows.status === "error" ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {filtered.map((member) => (
            <li key={member.id}>
              <Link to={`/crew/${member.id}`} className="booking-item history-link">
                <div className="booking-item-top">
                  <strong>{member.name}</strong>
                  <span className={member.is_active ? "pill pill-ok" : "pill pill-error"}>
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p>{member.headline || "Prisma Crew"}</p>
                <p className="muted">
                  {member.email} · {member.phone}
                  {member.is_verified ? " · Verified" : " · Unverified"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
