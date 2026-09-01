import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import BookingImagesDialog from "../components/BookingImagesDialog";
import ConfirmDialog from "../components/ConfirmDialog";
import ReassignCrewDialog from "../components/ReassignCrewDialog";
import RescheduleDialog from "../components/RescheduleDialog";
import StatusBanner from "../components/StatusBanner";
import { useBookingFlow } from "../app-hooks/useBookingFlow";
import { useReassignFlow } from "../app-hooks/useReassignFlow";
import {
  bookingPillClass,
  b2cCustomerPath,
  formatAddressLine,
  formatCurrency,
  formatStatus,
  guestAccessLabel,
  guestPillClass,
  initials,
  mapsUrl,
  paymentLabel,
} from "../lib/format";

export default function BookingDetailPage() {
  const { bookingId = "" } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const onCancelled = useCallback(() => {
    navigate("/bookings", { replace: true });
  }, [navigate]);
  const flow = useBookingFlow(bookingId, onCancelled);
  const reassign = useReassignFlow({
    kind: "appointment",
    targetId: bookingId,
    onSuccess: () => flow.refetch(),
  });

  const {
    booking,
    isLoading,
    isError,
    errorMessage,
    notice,
    clearNotice,
    confirm,
    confirmBusy,
    clearConfirm,
    showImages,
    setShowImages,
    activeImageTab,
    setActiveImageTab,
    imageTabs,
    getTabImages,
    canModify,
    showImageAction,
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
    requestCancelBooking,
    onEditDetails,
    requestResendGuestEmail,
  } = flow;

  const banner =
    notice ??
    reassign.notice ??
    (!reassign.visible && reassign.error
      ? { type: "error" as const, message: reassign.error }
      : null);

  if (!bookingId || (isError && !isLoading && !booking)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/bookings">Bookings</Link>
        </p>
        <h1 className="page-title">Booking not found</h1>
        <p className="lede">{errorMessage}</p>
      </AppShell>
    );
  }

  if (isLoading || !booking) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/bookings">Bookings</Link>
        </p>
        <h1 className="page-title">Booking</h1>
        <p className="muted">Loading booking…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/bookings">Bookings</Link>
        </p>
        <h1 className="page-title">{booking.booking_reference}</h1>
        <p className="lede">
          {booking.service_type}
          {booking.valet_type ? ` · ${booking.valet_type}` : ""}
          {booking.is_express_service ? " · Express" : ""}
        </p>
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
        <div className="card-row">
          <div>
            <p className="stat-label">Total</p>
            <p className="stat-value">{formatCurrency(booking.total_amount)}</p>
          </div>
          <span className={bookingPillClass(booking.status)}>{formatStatus(booking.status)}</span>
        </div>
        {canModify ? (
          <div className="card-actions">
            <button type="button" className="btn btn-primary" onClick={openReschedule}>
              Reschedule
            </button>
            <button type="button" className="btn btn-ghost" onClick={onEditDetails}>
              Edit details
            </button>
            <button type="button" className="btn btn-danger" onClick={requestCancelBooking}>
              Cancel appointment
            </button>
          </div>
        ) : (
          <p className="muted">
            This booking is {formatStatus(booking.status).toLowerCase()}. Reschedule and cancel
            actions are disabled.
          </p>
        )}
        {showImageAction ? (
          <div className="card-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowImages(true)}>
              View booking images
            </button>
          </div>
        ) : null}
      </section>

      {booking.is_guest ? (
        <section className="card">
          <h2>Guest checkout</h2>
          <p className="muted">
            Booked without a password. The client can view photos and notes from the emailed link, or
            claim a full account later.
          </p>
          <dl className="meta meta-2">
            <div>
              <dt>Portal link</dt>
              <dd>{guestAccessLabel(booking.guest_access)}</dd>
            </div>
            {booking.guest_access?.last_used_at ? (
              <div>
                <dt>Last opened</dt>
                <dd>{booking.guest_access.last_used_at.replace("T", " ").slice(0, 19)}</dd>
              </div>
            ) : null}
            {booking.can_claim ? (
              <div>
                <dt>Account</dt>
                <dd>Unclaimed — client can still set a password</dd>
              </div>
            ) : null}
          </dl>
          <div className="card-actions">
            {booking.client_user_id ? (
              <Link className="btn btn-ghost" to={b2cCustomerPath(booking.client_user_id)}>
                View customer record
              </Link>
            ) : null}
            <button type="button" className="btn btn-secondary" onClick={requestResendGuestEmail}>
              Resend portal email
            </button>
          </div>
        </section>
      ) : null}

      <section className="card">
        <h2>Client</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Name</dt>
            <dd>{booking.client_name}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>
              {booking.client_type}
              {booking.is_guest ? (
                <>
                  {" "}
                  <span className={guestPillClass()}>Guest</span>
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${booking.client_email}`}>{booking.client_email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${booking.client_phone.replace(/\s/g, "")}`}>{booking.client_phone}</a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Appointment</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Date &amp; time</dt>
            <dd>{booking.appointment_date}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{booking.duration_minutes} minutes</dd>
          </div>
          <div>
            <dt>Booked on</dt>
            <dd>{booking.booking_date}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{paymentLabel(booking.payment_status)}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Location</h2>
        <p>{formatAddressLine(booking.address)}</p>
        <div className="card-actions">
          <a className="btn btn-ghost" href={mapsUrl(booking.address)} target="_blank" rel="noreferrer">
            Open in Maps
          </a>
        </div>
      </section>

      <section className="card">
        <h2>Service</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Service type</dt>
            <dd>{booking.service_type}</dd>
          </div>
          <div>
            <dt>Valet package</dt>
            <dd>{booking.valet_type}</dd>
          </div>
        </dl>
        {booking.service_description ? (
          <>
            <p className="field-label">Description</p>
            <p>{booking.service_description}</p>
          </>
        ) : null}
      </section>

      <section className="card">
        <h2>Customer review</h2>
        {booking.is_reviewed ? (
          <dl className="meta meta-2">
            <div>
              <dt>Rating</dt>
              <dd>{booking.review_rating != null ? `${booking.review_rating} / 5` : "—"}</dd>
            </div>
            {booking.review_submitted_at ? (
              <div>
                <dt>Submitted</dt>
                <dd>{booking.review_submitted_at.replace("T", " ").slice(0, 19)}</dd>
              </div>
            ) : null}
            {booking.review_comment ? (
              <div>
                <dt>Comment</dt>
                <dd>{booking.review_comment}</dd>
              </div>
            ) : (
              <p className="muted">No written comment with this review.</p>
            )}
          </dl>
        ) : (
          <p className="muted">No review submitted yet.</p>
        )}
      </section>

      <section className="card">
        <h2>Add-ons</h2>
        {booking.addons.length === 0 ? (
          <p className="muted">No add-ons on this booking.</p>
        ) : (
          <ul className="benefit-list">
            {booking.addons.map((addon) => (
              <li key={addon}>{addon}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Loyalty</h2>
        {booking.is_guest ? (
          <p className="muted">Guest checkout — loyalty benefits apply only after the client claims an account.</p>
        ) : (
          <>
            <dl className="meta">
              <div>
                <dt>Tier</dt>
                <dd>{booking.loyalty_tier}</dd>
              </div>
            </dl>
            <p className="field-label">Active benefits</p>
            {booking.loyalty_benefits.length === 0 ? (
              <p className="muted">None listed.</p>
            ) : (
              <ul className="benefit-list">
                {booking.loyalty_benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Assigned team</h2>
        {booking.team_members.length === 0 ? (
          <p className="muted">No team assigned yet.</p>
        ) : (
          <ul className="booking-list">
            {booking.team_members.map((member) => (
              <li key={member.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>
                    <span className="avatar avatar-inline">
                      {initials(member.name)}
                    </span>
                    {member.name}
                  </strong>
                  <span className="muted">{member.role}</span>
                </div>
                <p>
                  <a href={`tel:${member.phone.replace(/\s/g, "")}`}>{member.phone}</a>
                  {" · "}
                  <a href={`mailto:${member.email}`}>{member.email}</a>
                </p>
              </li>
            ))}
          </ul>
        )}
        {canModify ? (
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={reassign.isLoading}
              onClick={() => reassign.open()}
            >
              {reassign.isLoading ? "Loading detailers…" : "Reassign crew"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="card">
        <h2>Special instructions</h2>
        <p>{booking.special_instructions?.trim() ? booking.special_instructions : "—"}</p>
      </section>

      {rescheduleVisible ? (
        <RescheduleDialog
          title="Reschedule appointment"
          hint="Pick a date, then load slots from detailer availability."
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

      {showImages ? (
        <BookingImagesDialog
          bookingReference={booking.booking_reference}
          tabs={imageTabs}
          activeTab={activeImageTab}
          onSelectTab={setActiveImageTab}
          getTabImages={getTabImages}
          onClose={() => setShowImages(false)}
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
