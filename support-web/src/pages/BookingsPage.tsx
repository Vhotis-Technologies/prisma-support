import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useBookingsListFlow } from "../app-hooks/useBookingsListFlow";
import { bookingPath, bookingPillClass, formatCurrency, formatStatus, guestPillClass } from "../lib/format";

export default function BookingsPage() {
  const { searchQuery, setSearchQuery, guestOnly, setGuestOnly, rows, filtered, queueHint, refreshing, onRefresh } =
    useBookingsListFlow();

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Bookings</h1>
          <p className="lede">Search by client name or booking reference. Bulk orders open as a fleet rollup.</p>
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
          <span className="visually-hidden">Search bookings</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by reference or client name"
            autoComplete="off"
          />
        </label>
        <p className="muted">
          {queueHint}
        </p>
        <label className="check-row">
          <input
            type="checkbox"
            checked={guestOnly}
            onChange={(event) => setGuestOnly(event.target.checked)}
          />
          <span>Guests only</span>
        </label>
      </div>

      {rows.status === "loading" && filtered.length === 0 ? (
        <LoadingLine>Loading bookings…</LoadingLine>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No matching bookings. Try a different name or reference."
              : rows.status === "error"
                ? "Could not load bookings. Retry to try again."
                : "When new bookings arrive, they will appear here."
          }
          actionLabel={rows.status === "error" ? "Retry" : undefined}
          onAction={rows.status === "error" ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {filtered.map((booking) => (
            <li key={booking.id}>
              <Link to={bookingPath(booking)} className="booking-item history-link">
                <div className="booking-item-top">
                  <strong>{booking.booking_reference}</strong>
                  <span className={bookingPillClass(booking.status)}>
                    {formatStatus(booking.status)}
                  </span>
                </div>
                <p>
                  {booking.client_name}
                  {booking.is_guest ? (
                    <>
                      {" "}
                      <span className={guestPillClass()}>Guest</span>
                    </>
                  ) : null}
                </p>
                <p className="muted">
                  {booking.kind === "bulk_order"
                    ? `Bulk · ${booking.vehicle_count} vehicle${booking.vehicle_count === 1 ? "" : "s"} · ${formatCurrency(booking.total_amount)} · ${booking.appointment_date}`
                    : `${booking.client_type} · ${booking.appointment_date}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
