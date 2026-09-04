import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import ConfirmDialog from "../components/ConfirmDialog";
import PersonalDataExportPanel from "../components/PersonalDataExportPanel";
import StatusBanner from "../components/StatusBanner";
import VehicleList from "../components/VehicleList";
import { useCustomerDetailFlow } from "../app-hooks/useCustomerDetailFlow";
import {
  bookingPillClass,
  formatAddressLine,
  formatCurrency,
  formatStatus,
  vehiclePath,
} from "../lib/format";

export default function PartnerDetailPage() {
  const { partnerId = "" } = useParams<{ partnerId: string }>();
  const flow = useCustomerDetailFlow(partnerId, "partners");
  const { partner, isLoading, isError, errorMessage, notice, clearNotice, showNotice, referredUsers } =
    flow;

  if (!partnerId || (isError && !isLoading && !partner)) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">Partner not found</h1>
        <p className="lede">{errorMessage}</p>
      </AppShell>
    );
  }

  if (isLoading || !partner) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/customers">Customers</Link>
        </p>
        <h1 className="page-title">Partner customer</h1>
        <p className="muted">Loading partner…</p>
      </AppShell>
    );
  }

  const bank = partner.bank_account_summary;
  const payouts = partner.payout_requests ?? [];

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/customers">Customers</Link> · Partner
        </p>
        <h1 className="page-title">{partner.business_name}</h1>
        <p className="lede">
          Referral code {partner.referral_code} · {partner.contact.email}
        </p>
      </section>

      <StatusBanner notice={notice} onDismiss={clearNotice} />

      <PersonalDataExportPanel
        entityType="partner"
        entityId={partner.id}
        defaultEmail={partner.contact.email}
        onNotice={showNotice}
      />

      <section className="card">
        <div className="card-row">
          <h2>Referral metrics</h2>
          <Link to={`/customers/partners/${partner.id}/referred`} className="btn btn-ghost">
            Referred users
          </Link>
        </div>
        <dl className="meta meta-2">
          <div>
            <dt>Total referred</dt>
            <dd>{partner.total_referred}</dd>
          </div>
          <div>
            <dt>Active / churned</dt>
            <dd>
              {partner.active_referred} / {partner.churned_referred}
            </dd>
          </div>
          <div>
            <dt>Conversion</dt>
            <dd>{(partner.conversion_rate * 100).toFixed(1)}%</dd>
          </div>
          <div>
            <dt>Vehicles registered</dt>
            <dd>{partner.vehicles_registered}</dd>
          </div>
        </dl>
        <p className="muted">
          Referred users in support records: {flow.referredLoading ? "…" : referredUsers.length}
        </p>
      </section>

      <section className="card">
        <h2>Activity and revenue</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Total spend</dt>
            <dd>{formatCurrency(partner.total_spend)}</dd>
          </div>
          <div>
            <dt>Total bookings</dt>
            <dd>{partner.total_bookings}</dd>
          </div>
          <div>
            <dt>Completed / cancelled</dt>
            <dd>
              {partner.completed_bookings} / {partner.cancelled_bookings}
            </dd>
          </div>
          <div>
            <dt>Revenue total</dt>
            <dd>{formatCurrency(partner.revenue_total)}</dd>
          </div>
          <div>
            <dt>Revenue this month</dt>
            <dd>{formatCurrency(partner.revenue_this_month)}</dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Commissions</h2>
        <dl className="meta meta-2">
          <div>
            <dt>Total earned</dt>
            <dd>{formatCurrency(partner.commission_total_earned)}</dd>
          </div>
          <div>
            <dt>Pending</dt>
            <dd>{formatCurrency(partner.commission_pending)}</dd>
          </div>
          <div>
            <dt>Paid</dt>
            <dd>{formatCurrency(partner.commission_paid)}</dd>
          </div>
          {partner.open_payout_total != null ? (
            <div>
              <dt>Open payouts</dt>
              <dd>{formatCurrency(partner.open_payout_total)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {bank ? (
        <section className="card">
          <h2>Bank account</h2>
          {bank.has_bank_account ? (
            <dl className="meta meta-2">
              <div>
                <dt>Account holder</dt>
                <dd>{bank.account_holder_name || "—"}</dd>
              </div>
              <div>
                <dt>IBAN</dt>
                <dd>{bank.iban_masked || "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="muted">No bank account on file.</p>
          )}
        </section>
      ) : null}

      {payouts.length > 0 ? (
        <section className="card">
          <h2>Payout requests</h2>
          <ul className="booking-list">
            {payouts.map((payout) => (
              <li key={payout.id} className="booking-item">
                <div className="booking-item-top">
                  <strong>{formatCurrency(payout.amount_requested)}</strong>
                  <span className={bookingPillClass(payout.status === "paid" ? "completed" : payout.status)}>
                    {formatStatus(payout.status)}
                  </span>
                </div>
                <p className="muted">
                  Requested {payout.requested_at_display || payout.requested_at}
                  {payout.paid_at_display ? ` · Paid ${payout.paid_at_display}` : ""}
                </p>
                {payout.admin_notes ? <p className="muted">{payout.admin_notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>Address</h2>
        <p>{formatAddressLine(partner.address)}</p>
        <p className="muted">
          <a href={`mailto:${partner.contact.email}`}>{partner.contact.email}</a>
          {" · "}
          <a href={`tel:${partner.contact.phone.replace(/\s/g, "")}`}>{partner.contact.phone}</a>
        </p>
      </section>

      <section className="card">
        <h2>Vehicles</h2>
        <VehicleList
          vehicles={partner.vehicles ?? []}
          empty="No vehicles on this partner profile."
          hrefFor={(vehicle) =>
            vehiclePath(vehicle.id, {
              userId: partner.user_id,
              partnerId: partner.id,
            })
          }
          onRemove={
            partner.user_id
              ? (vehicle) =>
                  flow.requestRemoveVehicle(vehicle.id, vehicle.registration_number, {
                    userId: partner.user_id,
                    partnerId: partner.id,
                  })
              : undefined
          }
          removingId={flow.removingVehicleId}
        />
      </section>

      {flow.confirm ? (
        <ConfirmDialog {...flow.confirm} busy={flow.confirmBusy} onClose={flow.clearConfirm} />
      ) : null}
    </AppShell>
  );
}
