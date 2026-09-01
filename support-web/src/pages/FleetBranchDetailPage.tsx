import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import VehicleList from "../components/VehicleList";
import { useFleetBranchFlow } from "../app-hooks/useFleetBranchFlow";
import { formatAddressLine, formatCurrency, vehiclePath } from "../lib/format";

export default function FleetBranchDetailPage() {
  const { fleetId = "", branchId = "" } = useParams<{ fleetId: string; branchId: string }>();
  const navigate = useNavigate();
  const onRemoved = useCallback(() => {
    navigate(`/customers/fleets/${fleetId}`, { replace: true });
  }, [fleetId, navigate]);
  const flow = useFleetBranchFlow(fleetId, branchId, onRemoved);
  const { branch, isLoading, isError, errorMessage, notice, clearNotice } = flow;

  if (!fleetId || !branchId || (isError && !isLoading && !branch)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">Branch not found</h1>
        <p className="lede">{errorMessage}</p>
      </AppShell>
    );
  }

  if (isLoading || !branch) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to={`/customers/fleets/${fleetId}`}>Fleet</Link>
        </p>
        <h1 className="page-title">Fleet branch</h1>
        <p className="muted">Loading branch…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/customers">Customers</Link>
          {" · "}
          <Link to={`/customers/fleets/${fleetId}`}>Fleet</Link> · Branch
        </p>
        <h1 className="page-title">{branch.name}</h1>
        <p className="lede">
          {branch.manager_name} · Branch admin
        </p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <section className="card">
        <h2>Branch overview</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Manager</dt>
            <dd>{branch.manager_name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${branch.manager_email}`}>{branch.manager_email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${branch.manager_phone.replace(/\s/g, "")}`}>{branch.manager_phone}</a>
            </dd>
          </div>
          <div>
            <dt>Address</dt>
            <dd>{formatAddressLine(branch.address)}</dd>
          </div>
          <div>
            <dt>Vehicles / bookings</dt>
            <dd>
              {branch.vehicle_count} / {branch.booking_count}
            </dd>
          </div>
          <div>
            <dt>Monthly spend</dt>
            <dd>
              {formatCurrency(branch.spent_this_month)} / {formatCurrency(branch.spend_limit)}
            </dd>
          </div>
          <div>
            <dt>Avg booking value</dt>
            <dd>{formatCurrency(branch.average_booking_value)}</dd>
          </div>
          <div>
            <dt>Completion rate</dt>
            <dd>{(branch.completion_rate * 100).toFixed(1)}%</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Vehicles</h2>
        <VehicleList
          vehicles={branch.vehicles ?? []}
          empty="No vehicles on this branch."
          hrefFor={(vehicle) => vehiclePath(vehicle.id, { fleetId })}
          onRemove={(vehicle) => flow.requestRemoveVehicle(vehicle.id, vehicle.registration_number)}
          removingId={flow.removingVehicleId}
        />
      </section>

      <section className="card">
        <h2>Danger zone</h2>
        <p className="muted">Remove this branch from the fleet if it has no vehicles.</p>
        <div className="card-actions">
          <button type="button" className="btn btn-danger" onClick={flow.requestRemoveBranch}>
            Remove branch
          </button>
        </div>
      </section>

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
