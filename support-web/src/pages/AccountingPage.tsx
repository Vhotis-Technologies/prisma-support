import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import EmptyState from "../components/EmptyState";
import LoadingLine from "../components/LoadingLine";
import StatusBanner from "../components/StatusBanner";
import { useAccountingListFlow } from "../app-hooks/useAccountingListFlow";
import {
  accountingCurrencyLine,
  accountingMonthPath,
  accountingTxnCount,
  monthHeading,
} from "../lib/format";

export default function AccountingPage() {
  const { rows, summaries, refreshing, onRefresh } = useAccountingListFlow();

  return (
    <AppShell>
      <section className="welcome welcome--split">
        <div>
          <p className="kicker">Work</p>
          <h1 className="page-title">Accounting</h1>
          <p className="lede">
            Monthly totals for succeeded payments. Open a month for currency, VAT, and type
            breakdowns.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={refreshing || rows.status === "loading"}
          onClick={onRefresh}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </section>

      <StatusBanner
        notice={rows.status === "error" ? { type: "error", message: rows.message } : null}
      />

      {rows.status === "loading" && summaries.length === 0 ? (
        <LoadingLine>Loading accounting…</LoadingLine>
      ) : summaries.length === 0 ? (
        <EmptyState
          message={
            rows.status === "error"
              ? "Could not load accounting. Retry to try again."
              : "No payment transactions in range."
          }
          actionLabel={rows.status === "error" ? "Retry" : undefined}
          onAction={rows.status === "error" ? onRefresh : undefined}
          actionDisabled={refreshing}
        />
      ) : (
        <ul className="booking-list">
          {summaries.map((summary) => (
            <li key={summary.year_month}>
              <Link
                to={accountingMonthPath(summary.year, summary.month)}
                className="booking-item history-link"
              >
                <div className="booking-item-top">
                  <strong>{monthHeading(summary.year, summary.month)}</strong>
                  <span className="pill pill-pending">
                    {accountingTxnCount(summary)} tx
                  </span>
                </div>
                <p className="muted">{accountingCurrencyLine(summary)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
