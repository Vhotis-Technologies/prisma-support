import { Link, useParams, useSearchParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import StatusBanner from "../components/StatusBanner";
import { useVehicleDetailFlow } from "../app-hooks/useVehicleDetailFlow";
import {
  bookingPillClass,
  formatCurrency,
  formatDate,
  formatStatus,
} from "../lib/format";
import type { VehicleInspection } from "../types/vehicle";

function inspectionScore(inspection: VehicleInspection): number | null {
  const statuses = [
    inspection.wiper_status,
    inspection.oil_level,
    inspection.coolant_level,
    inspection.brake_fluid_level,
    inspection.battery_condition,
    inspection.headlights_status,
    inspection.taillights_status,
    inspection.indicators_status,
  ].filter((status) => Boolean(status));
  if (statuses.length === 0) return null;
  const good = statuses.filter(
    (status) => status === "good" || status === "working" || status === "needs_change",
  ).length;
  return Math.round((good / statuses.length) * 100);
}

function inspectionRows(inspection: VehicleInspection): { label: string; value: string }[] {
  const rows: Array<[string, string | null | undefined | number]> = [
    ["Tread depth", inspection.tire_tread_depth != null ? String(inspection.tire_tread_depth) : ""],
    ["Tire condition", inspection.tire_condition],
    ["Wipers", inspection.wiper_status],
    ["Oil", inspection.oil_level],
    ["Coolant", inspection.coolant_level],
    ["Brake fluid", inspection.brake_fluid_level],
    ["Battery", inspection.battery_condition],
    ["Headlights", inspection.headlights_status],
    ["Taillights", inspection.taillights_status],
    ["Indicators", inspection.indicators_status],
  ];
  return rows
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => ({ label, value: formatStatus(String(value)) }));
}

export default function VehicleDetailPage() {
  const { vehicleId = "" } = useParams<{ vehicleId: string }>();
  const [params] = useSearchParams();
  const backHint = params.get("fleetId")
    ? `/customers/fleets/${params.get("fleetId")}`
    : params.get("partnerId")
      ? `/customers/partners/${params.get("partnerId")}`
      : params.get("userId")
        ? `/customers/b2c/${params.get("userId")}`
        : "/customers";

  const flow = useVehicleDetailFlow(vehicleId);
  const { stats, isLoading, isError, errorMessage, notice, clearNotice } = flow;
  const vehicle = stats?.vehicle;

  if (!vehicleId || (isError && !isLoading && !vehicle)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to={backHint}>Customers</Link>
        </p>
        <h1 className="page-title">Vehicle not found</h1>
        <p className="lede">{errorMessage}</p>
      </AppShell>
    );
  }

  if (isLoading || !stats || !vehicle) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to={backHint}>Customers</Link>
        </p>
        <h1 className="page-title">Vehicle</h1>
        <p className="muted">Loading vehicle details…</p>
      </AppShell>
    );
  }

  const registration = (vehicle.licence || vehicle.registration_number || "").toUpperCase() || "N/A";
  const inspection = stats.latest_inspection;
  const score = inspection ? inspectionScore(inspection) : null;
  const timeline = stats.ownership_timeline ?? [];
  const transfers = stats.vehicle_transfers ?? [];
  const fleetLinks = stats.fleet_links ?? [];

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/customers">Customers</Link>
          {" · "}
          <Link to={backHint}>Back</Link>
        </p>
        <h1 className="page-title">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p className="lede">
          {registration} · {vehicle.color || "Colour unknown"}
        </p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      {vehicle.image ? (
        <section className="card">
          <img src={vehicle.image} alt="" className="vehicle-photo" />
        </section>
      ) : null}

      <section className="stat-grid">
        <article className="stat-card">
          <p className="stat-label">Total bookings</p>
          <p className="stat-value">{stats.total_bookings ?? 0}</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Total spent</p>
          <p className="stat-value">{formatCurrency(stats.total_amount ?? 0)}</p>
        </article>
      </section>

      <section className="card">
        <h2>Service</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Last cleaned</dt>
            <dd>{stats.last_cleaned ? formatDate(stats.last_cleaned) : "Never"}</dd>
          </div>
          <div>
            <dt>Next service</dt>
            <dd>
              {stats.next_recommended_service
                ? formatDate(stats.next_recommended_service)
                : "Not scheduled"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Ownership</h2>
        {typeof vehicle.owner_count === "number" ? (
          <p className="muted">Reported owner count: {vehicle.owner_count}</p>
        ) : null}
        {stats.current_owner ? (
          <dl className="meta meta-2">
            <div>
              <dt>Current owner</dt>
              <dd>{stats.current_owner.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${stats.current_owner.email}`}>{stats.current_owner.email}</a>
              </dd>
            </div>
            <div>
              <dt>Since</dt>
              <dd>{stats.current_owner.start_date}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{stats.current_owner.ownership_type}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">No active ownership period (vehicle may be between owners).</p>
        )}
      </section>

      {fleetLinks.length > 0 ? (
        <section className="card">
          <h2>Fleet associations</h2>
          <ul className="booking-list">
            {fleetLinks.map((link) => (
              <li key={link.fleet_vehicle_id} className="booking-item">
                <strong>{link.fleet_name || "Fleet"}</strong>
                <p className="muted">{link.branch_name ? `Branch: ${link.branch_name}` : "No branch"}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>Ownership history</h2>
        {timeline.length === 0 ? (
          <p className="muted">No ownership records.</p>
        ) : (
          <ul className="booking-list">
            {timeline.map((row) => (
              <li key={row.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{row.owner_name}</strong>
                  {row.is_current ? <span className="pill pill-ok">Current</span> : null}
                </div>
                <p className="muted">
                  {row.start_date}
                  {row.end_date ? ` → ${row.end_date}` : ""} · {row.ownership_type}
                </p>
                <p className="muted">{row.owner_email}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Transfers</h2>
        {transfers.length === 0 ? (
          <p className="muted">No transfer requests for this vehicle.</p>
        ) : (
          <ul className="booking-list">
            {transfers.map((transfer) => (
              <li key={transfer.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{formatStatus(transfer.status)}</strong>
                  <span className={bookingPillClass(transfer.status === "approved" ? "completed" : transfer.status)}>
                    {formatDate(transfer.requested_at)}
                  </span>
                </div>
                <p className="muted">
                  From {transfer.from_owner_name} ({transfer.from_owner_email})
                </p>
                <p className="muted">
                  To {transfer.to_owner_name} ({transfer.to_owner_email})
                </p>
                <p className="muted">Expires {formatDate(transfer.expires_at)}</p>
                {transfer.can_approve && transfer.can_reject ? (
                  <div className="card-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={flow.busyTransferId === transfer.id}
                      onClick={() => flow.requestTransferAction(transfer.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={flow.busyTransferId === transfer.id}
                      onClick={() => flow.requestTransferAction(transfer.id, "reject")}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="card-row">
          <h2>Latest inspection</h2>
          {score != null ? <span className="pill pill-pending">{score}% healthy</span> : null}
        </div>
        {!inspection ? (
          <p className="muted">No inspection on file.</p>
        ) : (
          <>
            <dl className="meta meta-2">
              {inspection.booking_reference ? (
                <div>
                  <dt>Booking</dt>
                  <dd>{inspection.booking_reference}</dd>
                </div>
              ) : null}
              {inspection.inspected_at ? (
                <div>
                  <dt>Inspected</dt>
                  <dd>{formatDate(inspection.inspected_at)}</dd>
                </div>
              ) : null}
              {inspectionRows(inspection).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            {inspection.vehicle_condition_notes ? (
              <p className="muted">{inspection.vehicle_condition_notes}</p>
            ) : null}
            {inspection.damage_report ? <p className="muted">{inspection.damage_report}</p> : null}
          </>
        )}
      </section>

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
