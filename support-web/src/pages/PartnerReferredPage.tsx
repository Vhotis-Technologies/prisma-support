import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import VehicleList from "../components/VehicleList";
import { useCustomerDetailFlow } from "../app-hooks/useCustomerDetailFlow";
import {
  formatCurrency,
  subscriptionLabel,
  subscriptionPillClass,
  vehiclePath,
} from "../lib/format";

export default function PartnerReferredPage() {
  const { partnerId = "" } = useParams<{ partnerId: string }>();
  const flow = useCustomerDetailFlow(partnerId, "partners");
  const { partner, isLoading, referredUsers, referredLoading, referredError } = flow;

  if (!partnerId || (!isLoading && !partner)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">Partner not found</h1>
      </AppShell>
    );
  }

  if (isLoading || !partner) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to={`/customers/partners/${partnerId}`}>Partner</Link>
        </p>
        <h1 className="page-title">Referred users</h1>
        <p className="muted">Loading referred users…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/customers">Customers</Link>
          {" · "}
          <Link to={`/customers/partners/${partner.id}`}>{partner.business_name}</Link>
        </p>
        <h1 className="page-title">Referred users</h1>
        <p className="lede">
          {referredLoading ? "Loading…" : `${referredUsers.length} users referred by this partner.`}
        </p>
      </section>

      <StatusBanner
        notice={referredError ? { type: "error", message: referredError } : null}
      />

      {referredLoading && referredUsers.length === 0 ? (
        <LoadingLine>Loading referred users…</LoadingLine>
      ) : referredUsers.length === 0 ? (
        <EmptyState
          message={
            referredError
              ? "Could not load referred users. Retry to try again."
              : "No referred users in support records yet."
          }
        />
      ) : (
        <ul className="booking-list">
          {referredUsers.map((user) => (
            <li key={user.id} className="booking-item">
              <div className="booking-item-top">
                <strong>{user.name}</strong>
                <span className={subscriptionPillClass(user.subscription)}>
                  {subscriptionLabel(user.subscription)}
                </span>
              </div>
              <p>
                {user.contact.email} · {formatCurrency(user.total_spend)} · {user.total_bookings}{" "}
                bookings
              </p>
              <p className="muted">
                Status: {user.referred_status}
                {user.joined_at ? ` · Joined ${user.joined_at}` : ""}
              </p>
              <div className="card-actions">
                <Link to={`/customers/b2c/${user.id}`} className="btn btn-ghost">
                  Open B2C record
                </Link>
              </div>
              {user.vehicles?.length ? (
                <VehicleList
                  vehicles={user.vehicles}
                  empty=""
                  hrefFor={(vehicle) => vehiclePath(vehicle.id, { userId: user.id })}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
