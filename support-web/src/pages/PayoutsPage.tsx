import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import {
  CREW_PAYOUT_SUB_TABS,
  PAYOUT_TABS,
  usePayoutsListFlow,
} from "../app-hooks/usePayoutsListFlow";
import {
  crewUnpaidPath,
  formatCurrency,
  payoutPath,
  payoutPillClass,
  payoutStatusLabel,
} from "../lib/format";

export default function PayoutsPage() {
  const {
    tab,
    crewSubTab,
    onSelectTab,
    onSelectCrewSubTab,
    searchQuery,
    setSearchQuery,
    isLoading,
    errorMessage,
    queueHint,
    lede,
    refreshing,
    onRefresh,
    filteredPartners,
    filteredUnpaid,
    filteredCrewQueue,
  } = usePayoutsListFlow();

  const empty =
    tab === "partner"
      ? filteredPartners.length === 0
      : crewSubTab === "unpaid"
        ? filteredUnpaid.length === 0
        : filteredCrewQueue.length === 0;

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Payouts</h1>
          <p className="lede">{lede}</p>
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

      <div className="photo-tabs" role="tablist" aria-label="Payout type">
        {PAYOUT_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={`photo-tab${tab === value ? " is-selected" : ""}`}
            onClick={() => onSelectTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "crew" ? (
        <div className="photo-tabs" role="tablist" aria-label="Crew payout status">
          {CREW_PAYOUT_SUB_TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={crewSubTab === value}
              className={`photo-tab${crewSubTab === value ? " is-selected" : ""}`}
              onClick={() => onSelectCrewSubTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <StatusBanner
        notice={errorMessage ? { type: "error", message: errorMessage } : null}
      />

      <div className="toolbar-row">
        <label className="field">
          <span className="visually-hidden">Search payouts</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name or email"
            autoComplete="off"
          />
        </label>
        <p className="muted">{queueHint}</p>
      </div>

      {isLoading && empty ? (
        <LoadingLine>Loading payouts…</LoadingLine>
      ) : empty ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No matches for your search."
              : errorMessage
                ? "Could not load payouts. Retry to try again."
                : tab === "partner"
                  ? "When a partner requests commission payment, it will appear here."
                  : crewSubTab === "unpaid"
                    ? "Crew members with completed jobs and unpaid earnings will appear here."
                    : crewSubTab === "pending"
                      ? "Pending crew payouts appear here after you create them from Unpaid."
                      : "Completed crew payments will appear here after you record them from Unpaid."
          }
          actionLabel={errorMessage ? "Retry" : undefined}
          onAction={errorMessage ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : tab === "partner" ? (
        <ul className="booking-list">
          {filteredPartners.map((item) => (
            <li key={item.id}>
              <Link to={payoutPath("partner", item.id)} className="booking-item history-link">
                <div className="booking-item-top">
                  <strong>{item.partner_name || "Partner"}</strong>
                  <span className={payoutPillClass(item.status)}>
                    {payoutStatusLabel(item.status)}
                  </span>
                </div>
                <p>{formatCurrency(item.amount_requested)}</p>
                <p className="muted">
                  {item.partner_user_email} · Requested {item.requested_at_display || item.requested_at}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : crewSubTab === "unpaid" ? (
        <ul className="booking-list">
          {filteredUnpaid.map((item) => (
            <li key={item.crew_member_id}>
              <Link to={crewUnpaidPath(item.crew_member_id)} className="booking-item history-link">
                <div className="booking-item-top">
                  <strong>{item.crew_member_name}</strong>
                  <span className="pill pill-pending">Unpaid</span>
                </div>
                <p>{formatCurrency(item.unpaid_amount)}</p>
                <p className="muted">
                  {item.crew_member_email} · {item.unpaid_job_count} job
                  {item.unpaid_job_count === 1 ? "" : "s"}
                  {item.latest_earning_at_display ? ` · Latest ${item.latest_earning_at_display}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="booking-list">
          {filteredCrewQueue.map((item) => (
            <li key={item.id}>
              <Link to={payoutPath("crew", item.id)} className="booking-item history-link">
                <div className="booking-item-top">
                  <strong>{item.crew_member_name || "Crew member"}</strong>
                  <span className={payoutPillClass(item.status)}>
                    {payoutStatusLabel(item.status)}
                  </span>
                </div>
                <p>{formatCurrency(item.amount)}</p>
                <p className="muted">
                  {item.crew_member_email}
                  {item.pay_frequency_label ? ` · ${item.pay_frequency_label}` : ""}
                  {crewSubTab === "paid" && item.paid_at_display
                    ? ` · Paid ${item.paid_at_display}`
                    : ` · Initiated ${item.requested_at_display || item.requested_at}`}
                  {crewSubTab === "paid" && item.payout_reference
                    ? ` · Ref ${item.payout_reference}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
