import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import {
  CUSTOMER_TABS,
  useCustomersListFlow,
} from "../app-hooks/useCustomersListFlow";
import {
  customerPath,
  formatCurrency,
  subscriptionLabel,
  subscriptionPillClass,
  tierPillClass,
} from "../lib/format";

export default function CustomersPage() {
  const {
    segment,
    onSelectSegment,
    searchQuery,
    setSearchQuery,
    filtered,
    isLoading,
    errorMessage,
    queueHint,
    refreshing,
    onRefresh,
  } = useCustomersListFlow();

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Customers</h1>
          <p className="lede">
            B2C, fleet, and partner records from the same support API as the Prisma Support app.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={refreshing || isLoading}
          onClick={onRefresh}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </section>

      <div className="photo-tabs" role="tablist" aria-label="Customer segment">
        {CUSTOMER_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={segment === value}
            className={`photo-tab${segment === value ? " is-selected" : ""}`}
            onClick={() => onSelectSegment(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <StatusBanner
        notice={errorMessage ? { type: "error", message: errorMessage } : null}
      />

      <div className="toolbar-row">
        <label className="field">
          <span className="visually-hidden">Search customers</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, email, or referral code"
            autoComplete="off"
          />
        </label>
        <p className="muted">
          {queueHint}
        </p>
      </div>

      {isLoading && filtered.length === 0 ? (
        <LoadingLine>Loading customers…</LoadingLine>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No matching customers. Try a different name or email."
              : errorMessage
                ? "Could not load customers. Retry to try again."
                : "When customer records exist on the client API, they will appear here."
          }
          actionLabel={errorMessage ? "Retry" : undefined}
          onAction={errorMessage ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {filtered.map((customer) => (
            <li key={customer.id}>
              <Link to={customerPath(customer)} className="booking-item history-link">
                {customer.type === "b2c" ? (
                  <>
                    <div className="booking-item-top">
                      <strong>{customer.name}</strong>
                      {customer.is_guest ? (
                        <span className="pill pill-pending">Guest</span>
                      ) : (
                        <span className={tierPillClass(customer.loyalty_tier)}>
                          {customer.loyalty_tier}
                        </span>
                      )}
                    </div>
                    <p>
                      {customer.is_guest ? (
                        <span className="muted">Guest checkout · unclaimed account</span>
                      ) : (
                        <span className={subscriptionPillClass(customer.subscription)}>
                          {subscriptionLabel(customer.subscription)}
                        </span>
                      )}
                    </p>
                    <p className="muted">
                      {customer.contact.email} · {formatCurrency(customer.total_spend)} ·{" "}
                      {customer.total_bookings} bookings
                    </p>
                  </>
                ) : customer.type === "fleet" ? (
                  <>
                    <div className="booking-item-top">
                      <strong>{customer.name}</strong>
                      <span className={subscriptionPillClass(customer.subscription)}>
                        {subscriptionLabel(customer.subscription)}
                      </span>
                    </div>
                    <p>Owner: {customer.fleet_owner}</p>
                    <p className="muted">
                      {customer.no_of_branches} branches · {customer.total_vehicles} vehicles ·{" "}
                      {customer.contact.email}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="booking-item-top">
                      <strong>{customer.business_name}</strong>
                      <span className="pill pill-pending">{customer.referral_code}</span>
                    </div>
                    <p>{customer.name}</p>
                    <p className="muted">
                      {customer.contact.email} · {customer.total_referred} referred
                    </p>
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
