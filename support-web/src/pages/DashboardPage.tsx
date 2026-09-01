import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useAuth } from "../auth/context";
import {
  DASHBOARD_TIMEFRAME_OPTIONS,
  useDashboardFlow,
} from "../app-hooks/useDashboardFlow";
import {
  bookingPath,
  bookingPillClass,
  formatMetricValue,
  formatStatus,
  formatTimestamp,
  supportRoleLabel,
  ticketPath,
  ticketPillClass,
} from "../lib/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const greeting = user?.first_name?.trim();
  const {
    timeframe,
    onSelectTimeframe,
    metrics,
    bookings,
    tickets,
    bookingsPreview,
    attentionTickets,
  } = useDashboardFlow();

  const metricItems = metrics.status === "ok" ? metrics.data.metrics : [];
  const meta = metrics.status === "ok" ? metrics.data.meta : undefined;

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">{supportRoleLabel(user?.role)}</p>
        <h1 className="page-title">
          Good to see you{greeting ? `, ${greeting}` : ""}.
        </h1>
        <p className="lede">
          Bookings, customers, and tickets — the same account as the Prisma Support app.
        </p>
      </section>

      <div className="photo-tabs" role="tablist" aria-label="Metrics timeframe">
        {DASHBOARD_TIMEFRAME_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={timeframe === value}
            className={`photo-tab${timeframe === value ? " is-selected" : ""}`}
            onClick={() => onSelectTimeframe(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {meta ? (
        <p className="muted">
          Totals in the last {meta.window_days} day{meta.window_days === 1 ? "" : "s"}; % vs. the
          prior {meta.window_days}-day period
          {metrics.status === "loading" ? " · refreshing…" : ""}.
        </p>
      ) : null}

      {metrics.status === "loading" && metricItems.length === 0 ? (
        <LoadingLine>Loading dashboard metrics…</LoadingLine>
      ) : null}

      <StatusBanner
        notice={metrics.status === "error" ? { type: "error", message: metrics.message } : null}
      />

      {metricItems.length > 0 ? (
        <section className={metricItems.length === 3 ? "stat-grid stat-grid--3" : "stat-grid"}>
          {metricItems.map((metric) => (
            <article key={metric.label} className="stat-card">
              <p className="stat-label">{metric.label}</p>
              <p className="stat-value">{formatMetricValue(metric.label, metric.value)}</p>
              <p className="muted">
                <span className={metric.isIncrease ? "pill pill-ok" : "pill pill-error"}>
                  {metric.isIncrease ? "↑" : "↓"} {metric.difference}
                </span>
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <div className="dash-stack">
        <section className="card">
          <div className="card-row">
            <div className="card-heading">
              <h2>Needs attention</h2>
              {tickets.status === "ok" ? (
                <span className="pill pill-pending" aria-label={`${attentionTickets.length} open tickets`}>
                  {attentionTickets.length}
                </span>
              ) : null}
            </div>
            <Link to="/tickets" className="btn btn-ghost">
              See all
            </Link>
          </div>

          {tickets.status === "loading" ? <LoadingLine>Loading tickets…</LoadingLine> : null}
          <StatusBanner
            notice={tickets.status === "error" ? { type: "error", message: tickets.message } : null}
          />
          {tickets.status === "ok" && attentionTickets.length === 0 ? (
            <p className="muted">There are no support tickets that need attention right now.</p>
          ) : null}
          {attentionTickets.length > 0 ? (
            <ul className="booking-list">
              {attentionTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link to={ticketPath(ticket.id)} className="booking-item history-link">
                    <div className="booking-item-top">
                      <strong>
                        {ticket.ticket_code} · {ticket.subject}
                      </strong>
                      <span className={ticketPillClass(ticket.status)}>
                        {formatStatus(ticket.status)}
                      </span>
                    </div>
                    <p>{ticket.client_name}</p>
                    <p className="muted">{formatTimestamp(ticket.timestamp)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="card">
          <div className="card-row">
            <div className="card-heading">
              <h2>Upcoming bookings</h2>
              {bookings.status === "ok" ? (
                <span
                  className="pill pill-pending"
                  aria-label={`${bookingsPreview.length} upcoming bookings`}
                >
                  {bookingsPreview.length}
                </span>
              ) : null}
            </div>
            <Link to="/bookings" className="btn btn-ghost">
              See all
            </Link>
          </div>

          {bookings.status === "loading" ? <LoadingLine>Loading bookings…</LoadingLine> : null}
          <StatusBanner
            notice={
              bookings.status === "error" ? { type: "error", message: bookings.message } : null
            }
          />
          {bookings.status === "ok" && bookingsPreview.length === 0 ? (
            <p className="muted">
              Confirmed visits due soon, in progress, or from the last 12 hours will appear here.
            </p>
          ) : null}
          {bookingsPreview.length > 0 ? (
            <ul className="booking-list">
              {bookingsPreview.map((booking) => (
                <li key={booking.id}>
                  <Link to={bookingPath(booking)} className="booking-item history-link">
                    <div className="booking-item-top">
                      <strong>{booking.client_name}</strong>
                      <span className={bookingPillClass(booking.status)}>
                        {formatStatus(booking.status)}
                      </span>
                    </div>
                    <p>{booking.appointment_date}</p>
                    <p className="muted">
                      {booking.booking_reference}
                      {booking.kind === "bulk_order"
                        ? ` · Bulk · ${booking.vehicle_count} vehicle${booking.vehicle_count === 1 ? "" : "s"}`
                        : ` · ${booking.client_type}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
