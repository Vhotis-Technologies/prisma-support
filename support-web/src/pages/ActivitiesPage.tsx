import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useActivityFeedFlow } from "../app-hooks/useActivityFeedFlow";
import {
  activityPath,
  activityTypeLabel,
  formatRelativeTime,
} from "../lib/format";

export default function ActivitiesPage() {
  const { rows, activities, meta, nowMs, refreshing, onRefresh } = useActivityFeedFlow();

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Activities</h1>
          <p className="lede">
            Recent changes across bookings, customers, fleets, and partners.
            {meta?.lookback_days != null
              ? ` Showing the last ${meta.lookback_days} days.`
              : ""}
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

      {rows.status === "loading" && activities.length === 0 ? (
        <LoadingLine>Loading activity…</LoadingLine>
      ) : activities.length === 0 ? (
        <EmptyState
          message={
            rows.status === "error"
              ? "Could not load activity. Retry to try again."
              : "There are no recent events in the selected period."
          }
          actionLabel={rows.status === "error" ? "Retry" : undefined}
          onAction={rows.status === "error" ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {activities.map((activity) => {
            const href = activityPath(activity);
            const body = (
              <>
                <div className="booking-item-top">
                  <strong>{activity.title}</strong>
                  <span className="pill pill-pending">{activityTypeLabel(activity.activity_type)}</span>
                </div>
                <p>{activity.summary}</p>
                <p className="muted">{formatRelativeTime(activity.timestamp, nowMs)}</p>
              </>
            );
            return (
              <li key={activity.id}>
                {href ? (
                  <Link to={href} className="booking-item history-link">
                    {body}
                  </Link>
                ) : (
                  <div className="booking-item">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
