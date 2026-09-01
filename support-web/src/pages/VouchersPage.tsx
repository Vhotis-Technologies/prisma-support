import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import CreateVoucherDialog from "../components/CreateVoucherDialog";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { VOUCHER_TABS, useVouchersListFlow } from "../app-hooks/useVouchersListFlow";
import {
  formatVoucherCredit,
  voucherCodeDisplay,
  voucherPath,
  voucherPillClass,
  voucherStatusLabel,
} from "../lib/format";
import { getVoucherDisplayStatus } from "../types/voucher";

export default function VouchersPage() {
  const {
    kind,
    onSelectKind,
    searchQuery,
    setSearchQuery,
    filtered,
    isLoading,
    errorMessage,
    queueHint,
    refreshing,
    onRefresh,
    nowMs,
    notice,
    clearNotice,
    createWinner,
  } = useVouchersListFlow();
  const [createOpen, setCreateOpen] = useState(false);

  const banner = notice ?? (errorMessage ? { type: "error" as const, message: errorMessage } : null);

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Vouchers</h1>
          <p className="lede">
            {kind === "winner"
              ? "Pre-assign winner vouchers by email. Customers with this email are linked automatically when the voucher is created or when they sign up."
              : "Customer-purchased gift vouchers. Recipient email sends only after Stripe confirms payment."}
          </p>
        </div>
        <div className="chip-row chip-row--flush">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={refreshing || isLoading}
            onClick={onRefresh}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          {kind === "winner" ? (
            <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
              Create voucher
            </button>
          ) : null}
        </div>
      </section>

      <div className="photo-tabs" role="tablist" aria-label="Voucher type">
        {VOUCHER_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            className={`photo-tab${kind === value ? " is-selected" : ""}`}
            onClick={() => onSelectKind(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <StatusBanner
        notice={banner}
        onDismiss={notice ? clearNotice : undefined}
      />

      <div className="toolbar-row">
        <label className="field">
          <span className="visually-hidden">Search vouchers</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by code or email"
            autoComplete="off"
          />
        </label>
        <p className="muted">{queueHint}</p>
      </div>

      {isLoading && filtered.length === 0 ? (
        <LoadingLine>Loading vouchers…</LoadingLine>
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            searchQuery.trim()
              ? "No matches for your search."
              : errorMessage
                ? "Could not load vouchers. Retry to try again."
                : kind === "winner"
                  ? "Create a voucher to see it listed here."
                  : "Gift vouchers purchased in the customer app appear here."
          }
          actionLabel={errorMessage ? "Retry" : undefined}
          onAction={errorMessage ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {filtered.map((voucher) => {
            const status = getVoucherDisplayStatus(voucher, nowMs);
            return (
              <li key={`${voucher.kind}-${voucher.id}`}>
                <Link to={voucherPath(voucher)} className="booking-item history-link">
                  <div className="booking-item-top">
                    <strong>{voucherCodeDisplay(voucher)}</strong>
                    <span className={voucherPillClass(status)}>{voucherStatusLabel(status)}</span>
                  </div>
                  <p>{voucher.assignedEmail}</p>
                  <p className="muted">{formatVoucherCredit(voucher.creditAmount)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {createOpen ? (
        <CreateVoucherDialog onCreate={createWinner} onClose={() => setCreateOpen(false)} />
      ) : null}
    </AppShell>
  );
}
