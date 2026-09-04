import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ComplimentaryWashesCard from "../components/ComplimentaryWashesCard";
import ConfirmDialog from "../components/ConfirmDialog";
import LoyaltyCard from "../components/LoyaltyCard";
import PersonalDataExportPanel from "../components/PersonalDataExportPanel";
import StatusBanner from "../components/StatusBanner";
import SubscriptionPanel from "../components/SubscriptionPanel";
import VehicleList from "../components/VehicleList";
import { useCustomerDetailFlow } from "../app-hooks/useCustomerDetailFlow";
import {
  formatAddressLine,
  formatCurrency,
  vehiclePath,
} from "../lib/format";

export default function B2cDetailPage() {
  const { customerId = "" } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const onDeleted = useCallback(() => { 
    navigate("/customers", { replace: true });
  }, [navigate]);
  const flow = useCustomerDetailFlow(customerId, "b2c", onDeleted);
  const { b2c, isLoading, isError, errorMessage, notice, clearNotice, showNotice } = flow;

  if (!customerId || (isError && !isLoading && !b2c)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">Customer not found</h1>
        <p className="lede">{errorMessage}</p>
      </AppShell>
    );
  }

  if (isLoading || !b2c) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">B2C customer</h1>
        <p className="muted">Loading customer…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/customers">Customers</Link> · B2C
        </p>
        <h1 className="page-title">{b2c.name}</h1>
        <p className="lede">
          {b2c.contact.email} · {b2c.contact.phone}
          {b2c.is_guest ? (
            <>
              {" "}
              <span className="pill pill-pending">Guest</span>
            </>
          ) : null}
        </p>
      </section>

      {b2c.is_guest ? (
        <section className="card">
          <h2>Guest account</h2>
          <p className="muted">
            This person booked without a password. They can use the emailed results link or claim a
            full Prisma account to keep their vehicle and history.
          </p>
        </section>
      ) : null}

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="stat-grid">
        <article className="stat-card">
          <p className="stat-label">Total spend</p>
          <p className="stat-value">{formatCurrency(b2c.total_spend)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Total bookings</p>
          <p className="stat-value">{b2c.total_bookings}</p>
        </article>
      </section>

      {!b2c.is_guest ? (
        <>
          <ComplimentaryWashesCard complimentary={b2c.subscription_complimentary} />
          <LoyaltyCard loyalty={b2c.loyalty} />
          <SubscriptionPanel
            subscription={b2c.subscription}
            onTerminate={flow.requestTerminate}
            onRenew={flow.requestRenew}
          />
        </>
      ) : null}

      <section className="card">
        <h2>Account details</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${b2c.contact.email}`}>{b2c.contact.email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${b2c.contact.phone.replace(/\s/g, "")}`}>{b2c.contact.phone}</a>
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{formatAddressLine(b2c.address)}</dd>
          </div>
          <div>
            <dt>Last booking</dt>
            <dd>{b2c.last_booking_date || "—"}</dd>
          </div>
          <div>
            <dt>Avg booking value</dt>
            <dd>{formatCurrency(b2c.average_booking_value)}</dd>
          </div>
          <div>
            <dt>Completed / cancelled</dt>
            <dd>
              {b2c.completed_bookings} / {b2c.cancelled_bookings}
            </dd>
          </div>
        </dl>
        <p className="muted">
          Preferred: {b2c.preferred_services?.length ? b2c.preferred_services.join(", ") : "—"}
        </p>
        {b2c.notes ? <p className="muted">Notes: {b2c.notes}</p> : null}
      </section>

      <section className="card">
        <div className="card-row">
          <h2>Vehicles</h2>
          <span className="pill pill-pending">{b2c.no_of_vehicles}</span>
        </div>
        <VehicleList
          vehicles={b2c.vehicles ?? []}
          empty="No vehicles on this account."
          hrefFor={(vehicle) => vehiclePath(vehicle.id, { userId: b2c.id })}
          onRemove={(vehicle) =>
            flow.requestRemoveVehicle(vehicle.id, vehicle.registration_number, { userId: b2c.id })
          }
          removingId={flow.removingVehicleId}
        />
      </section>

      <PersonalDataExportPanel
        entityType="b2c"
        entityId={b2c.id}
        defaultEmail={b2c.contact.email}
        onNotice={showNotice}
      />

      {!b2c.is_guest ? (
        <section className="card">
          <h2>Danger zone</h2>
          <p className="muted">
            Deactivate this account. They will not be able to sign in. Booking history is retained.
          </p>
          <div className="card-actions">
          <button type="button" className="btn btn-danger" onClick={flow.requestDeleteAccount}>
            Delete account
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
