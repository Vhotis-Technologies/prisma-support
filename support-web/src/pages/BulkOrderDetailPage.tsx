import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import ReassignCrewDialog from "../components/ReassignCrewDialog";
import RescheduleDialog from "../components/RescheduleDialog";
import { useBulkOrderSupportFlow } from "../app-hooks/useBulkOrderSupportFlow";
import { useReassignFlow } from "../app-hooks/useReassignFlow";
import {
  bookingPillClass,
  formatCurrency,
  formatStatus,
  paymentLabel,
} from "../lib/format";
import type { AppointmentListItem, BookingDetails } from "../types/booking";

function toListRows(appointments: BookingDetails[]): AppointmentListItem[] {
  return appointments.map((appointment) =>
    appointment.kind === "appointment"
      ? (appointment as AppointmentListItem)
      : ({ kind: "appointment" as const, ...appointment } as AppointmentListItem),
  );
}

export default function BulkOrderDetailPage() {
  const { bulkOrderId = "" } = useParams<{ bulkOrderId: string }>();
  const flow = useBulkOrderSupportFlow(bulkOrderId);
  const reassign = useReassignFlow({
    kind: "bulk_order",
    targetId: bulkOrderId,
    onSuccess: () => flow.refetch(),
  });

  const {
    data,
    isLoading,
    isError,
    errorMessage,
    notice,
    clearNotice,
    confirm,
    confirmBusy,
    clearConfirm,
    canModify,
    openReschedule,
    closeReschedule,
    rescheduleVisible,
    rescheduleDate,
    setRescheduleDate,
    rescheduleSlots,
    selectedSlot,
    setSelectedSlot,
    loadRescheduleSlots,
    confirmReschedule,
    rescheduleBusy,
    slotsLoading,
    rescheduleSubmitting,
    requestCancelBulkOrder,
  } = flow;

  const banner =
    notice ??
    reassign.notice ??
    (!reassign.visible && reassign.error
      ? { type: "error" as const, message: reassign.error }
      : null);
  const appointments = data?.appointments?.length ? toListRows(data.appointments) : [];

  if (!bulkOrderId || (isError && !isLoading && !data)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/bookings">Bookings</Link>
        </p>
        <h1 className="page-title">Bulk order not found</h1>
        <p className="lede">{errorMessage}</p>
      </AppShell>
    );
  }

  if (isLoading || !data) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/bookings">Bookings</Link>
        </p>
        <h1 className="page-title">Fleet bulk order</h1>
        <p className="muted">Loading bulk order…</p>
      </AppShell>
    );
  }

  const { bulk_order: bulk, payment_summary: pay } = data;

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/bookings">Bookings</Link> · Bulk order
        </p>
        <h1 className="page-title">{bulk.booking_reference}</h1>
        <p className="lede">{bulk.client_name}</p>
      </section>

      <StatusBanner
        notice={banner}
        onDismiss={
          notice || reassign.notice
            ? () => {
                clearNotice();
                reassign.clearNotice();
              }
            : undefined
        }
      />

      <section className="card">
        <dl className="meta meta-2">
          <div>
            <dt>Vehicles</dt>
            <dd>{bulk.number_of_vehicles}</dd>
          </div>
          <div>
            <dt>Order total</dt>
            <dd>{formatCurrency(bulk.total_amount)}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{paymentLabel(String(pay.payment_status))}</dd>
          </div>
          <div>
            <dt>Stripe</dt>
            <dd>{bulk.payment_status}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${bulk.client_email}`}>{bulk.client_email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${bulk.client_phone.replace(/\s/g, "")}`}>{bulk.client_phone}</a>
            </dd>
          </div>
        </dl>
        <p className="muted">
          Paid in: {formatCurrency(pay.payments_total)} · Refunds: {formatCurrency(pay.refunds_total)}
        </p>
        <p className="muted">
          Cancel or reschedule the whole fleet bulk order here. Individual line appointments cannot
          use the standard appointment cancel flow.
        </p>
        {canModify ? (
          <div className="card-actions">
            <button type="button" className="btn btn-primary" onClick={openReschedule}>
              Reschedule bulk order
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={reassign.isLoading}
              onClick={() => reassign.open()}
            >
              {reassign.isLoading ? "Loading detailers…" : "Reassign crew"}
            </button>
            <button type="button" className="btn btn-danger" onClick={requestCancelBulkOrder}>
              Cancel bulk order
            </button>
          </div>
        ) : (
          <p className="muted">
            This bulk order cannot be rescheduled or cancelled from here (completed, cancelled, or
            all lines finished).
          </p>
        )}
      </section>

      <section>
        <h2 className="section-title">Appointments ({appointments.length})</h2>
        {appointments.length === 0 ? (
          <p className="muted">No line appointments on this order.</p>
        ) : (
          <ul className="booking-list">
            {appointments.map((appointment) => (
              <li key={appointment.id}>
                <Link to={`/bookings/${appointment.id}`} className="booking-item history-link">
                  <div className="booking-item-top">
                    <strong>{appointment.booking_reference}</strong>
                    <span className={bookingPillClass(appointment.status)}>
                      {formatStatus(appointment.status)}
                    </span>
                  </div>
                  <p>{appointment.client_name}</p>
                  <p className="muted">{appointment.appointment_date}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {rescheduleVisible ? (
        <RescheduleDialog
          title="Reschedule bulk order"
          hint="New date, then load times. All vehicles move together (same rules as the client fleet flow; not within 12 hours of job start)."
          date={rescheduleDate}
          slots={rescheduleSlots}
          selectedSlot={selectedSlot}
          busy={rescheduleBusy}
          slotsLoading={slotsLoading}
          submitting={rescheduleSubmitting}
          onDateChange={setRescheduleDate}
          onSelectSlot={setSelectedSlot}
          onLoadSlots={loadRescheduleSlots}
          onConfirm={confirmReschedule}
          onClose={closeReschedule}
        />
      ) : null}

      <ReassignCrewDialog flow={reassign} />

      {confirm ? (
        <ConfirmDialog {...confirm} busy={confirmBusy} onClose={clearConfirm} />
      ) : null}
      {reassign.confirm ? (
        <ConfirmDialog
          {...reassign.confirm}
          busy={reassign.confirmBusy}
          onClose={reassign.clearConfirm}
        />
      ) : null}
    </AppShell>
  );
}
