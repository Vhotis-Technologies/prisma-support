import { Link } from "react-router-dom";
import type { Vehicle } from "../types/customer";
import { bookingPillClass, formatDate, formatStatus } from "../lib/format";

type VehicleListProps = {
  vehicles: Vehicle[];
  empty: string;
  hrefFor: (vehicle: Vehicle) => string;
  onRemove?: (vehicle: Vehicle) => void;
  removingId?: string | null;
};

export default function VehicleList({
  vehicles,
  empty,
  hrefFor,
  onRemove,
  removingId,
}: VehicleListProps) {
  if (vehicles.length === 0) {
    return <p className="muted">{empty}</p>;
  }

  return (
    <ul className="booking-list">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id} className="booking-item">
          <div className="booking-item-top">
            <strong>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </strong>
            <span className={bookingPillClass(vehicle.status === "active" ? "confirmed" : vehicle.status)}>
              {formatStatus(vehicle.status)}
            </span>
          </div>
          <p>{vehicle.registration_number}</p>
          <p className="muted">
            {vehicle.color}
            {vehicle.last_service_date ? ` · Last service ${formatDate(vehicle.last_service_date)}` : ""}
          </p>
          <div className="card-actions">
            <Link to={hrefFor(vehicle)} className="btn btn-ghost">
              View vehicle
            </Link>
            {onRemove ? (
              <button
                type="button"
                className="btn btn-danger"
                disabled={removingId === vehicle.id}
                onClick={() => onRemove(vehicle)}
              >
                {removingId === vehicle.id ? "Removing…" : "Remove"}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
