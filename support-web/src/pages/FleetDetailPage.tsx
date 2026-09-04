import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import PersonalDataExportPanel from "../components/PersonalDataExportPanel";
import StatusBanner from "../components/StatusBanner";
import SubscriptionPanel from "../components/SubscriptionPanel";
import { useCustomerDetailFlow } from "../app-hooks/useCustomerDetailFlow";
import { formatCurrency } from "../lib/format";

export default function FleetDetailPage() {
  const { fleetId = "" } = useParams<{ fleetId: string }>();
  const flow = useCustomerDetailFlow(fleetId, "fleets");
  const { fleet, isLoading, isError, errorMessage, notice, clearNotice, showNotice } = flow;

  if (!fleetId || (isError && !isLoading && !fleet)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">Fleet not found</h1>
        <p className="lede">{errorMessage}</p>
      </AppShell>
    );
  }

  if (isLoading || !fleet) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">Fleet customer</h1>
        <p className="muted">Loading fleet…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/customers">Customers</Link> · Fleet
        </p>
        <h1 className="page-title">{fleet.name}</h1>
        <p className="lede">Owner: {fleet.fleet_owner}</p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <PersonalDataExportPanel
        entityType="fleet"
        entityId={fleet.id}
        defaultEmail={fleet.contact.email}
        onNotice={showNotice}
      />

      <section className="stat-grid">
        <article className="stat-card">
          <p className="stat-label">Total spend</p>
          <p className="stat-value">{formatCurrency(fleet.total_spend)}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Bookings</p>
          <p className="stat-value">{fleet.total_bookings}</p>
        </article>
      </section>

      <section className="card">
        <h2>Overview</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Referral code</dt>
            <dd>{fleet.referral_code}</dd>
          </div>
          <div>
            <dt>Branches</dt>
            <dd>{fleet.no_of_branches}</dd>
          </div>
          <div>
            <dt>Vehicles</dt>
            <dd>{fleet.total_vehicles}</dd>
          </div>
          <div>
            <dt>Admins</dt>
            <dd>{fleet.no_of_admins}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${fleet.contact.email}`}>{fleet.contact.email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${fleet.contact.phone.replace(/\s/g, "")}`}>{fleet.contact.phone}</a>
            </dd>
          </div>
        </dl>
      </section>

      <SubscriptionPanel
        subscription={fleet.subscription}
        onTerminate={flow.requestTerminate}
        onRenew={flow.requestRenew}
      />

      <section className="card">
        <h2>Branches</h2>
        {fleet.branches.length === 0 ? (
          <p className="muted">No branches on this fleet.</p>
        ) : (
          <ul className="booking-list">
            {fleet.branches.map((branch) => (
              <li key={branch.id}>
                <Link
                  to={`/customers/fleets/${fleet.id}/branches/${branch.id}`}
                  className="booking-item history-link"
                >
                  <div className="booking-item-top">
                    <strong>{branch.name}</strong>
                    <span className="pill pill-pending">{branch.vehicle_count} vehicles</span>
                  </div>
                  <p className="muted">
                    {branch.city || "—"} · {branch.booking_count} bookings · {branch.admin_count} admins
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Admins</h2>
        {fleet.admins.length === 0 ? (
          <p className="muted">No admins listed.</p>
        ) : (
          <ul className="booking-list">
            {fleet.admins.map((admin) => (
              <li key={admin.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{admin.name}</strong>
                  <span className="muted">{admin.branch_name}</span>
                </div>
                <p>
                  <a href={`mailto:${admin.email}`}>{admin.email}</a>
                  {" · "}
                  <a href={`tel:${admin.phone.replace(/\s/g, "")}`}>{admin.phone}</a>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
