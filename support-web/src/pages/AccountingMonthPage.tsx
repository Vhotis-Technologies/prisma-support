import { Link, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { useAccountingMonthFlow } from "../app-hooks/useAccountingMonthFlow";
import { accountingTxnLabel, monthHeading } from "../lib/format";

export default function AccountingMonthPage() {
  const { year: yearParam, month: monthParam } = useParams<{ year: string; month: string }>();
  const year = Number(yearParam);
  const month = Number(monthParam);
  const paramsOk =
    Number.isFinite(year) &&
    Number.isFinite(month) &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000 &&
    year <= 2100;
  const { detail, isLoading, isError, errorMessage, refetch } = useAccountingMonthFlow(
    paramsOk ? year : 0,
    paramsOk ? month : 0,
    paramsOk,
  );

  if (!paramsOk) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/accounting">Accounting</Link>
        </p>
        <h1 className="page-title">Invalid month</h1>
      </AppShell>
    );
  }

  if (isError && !isLoading && !detail) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/accounting">Accounting</Link>
        </p>
        <h1 className="page-title">{monthHeading(year, month)}</h1>
        <p className="lede">{errorMessage}</p>
        <div className="card-actions">
          <button type="button" className="btn btn-ghost" onClick={refetch}>
            Retry
          </button>
        </div>
      </AppShell>
    );
  }

  if (isLoading || !detail) {
    return (
      <AppShell>
        <p className="kicker">
          <Link to="/accounting">Accounting</Link>
        </p>
        <h1 className="page-title">{monthHeading(year, month)}</h1>
        <p className="muted">Loading month…</p>
      </AppShell>
    );
  }

  const currencyEntries = Object.entries(detail.currency_totals);
  const vatEntries = Object.entries(detail.vat_by_currency);
  const typeEntries = Object.entries(detail.by_transaction_type);
  const countLabel = `${detail.transaction_count} transaction${detail.transaction_count === 1 ? "" : "s"}`;

  return (
    <AppShell>
      <section className="welcome">
        <p className="kicker">
          <Link to="/accounting">Accounting</Link>
        </p>
        <h1 className="page-title">{monthHeading(year, month)}</h1>
        <p className="lede">{countLabel}</p>
      </section>

      <section className="card">
        <h2>Totals by currency</h2>
        {currencyEntries.length === 0 ? (
          <p className="muted">No currency totals for this month.</p>
        ) : (
          <dl className="meta meta-2">
            {currencyEntries.map(([currency, row]) => (
              <div key={currency}>
                <dt>{currency}</dt>
                <dd>
                  {row.count} tx · {row.grand_total}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="card">
        <h2>VAT summary</h2>
        {vatEntries.length === 0 ? (
          <p className="muted">No VAT breakdown for this month.</p>
        ) : (
          vatEntries.map(([currency, vat]) => (
            <div key={currency}>
              <p className="field-label">{currency}</p>
              <p className="muted muted--block">
                Taxable gross {vat.taxable_gross ?? "0.00"} · Net {vat.net_of_vat ?? "0.00"} · VAT{" "}
                {vat.vat_amount ?? "0.00"} · Exempt {vat.exempt_total ?? "0.00"}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2>By transaction type</h2>
        {typeEntries.length === 0 ? (
          <p className="muted">No transaction types for this month.</p>
        ) : (
          <dl className="meta meta-2">
            {typeEntries.map(([type, row]) => (
              <div key={type}>
                <dt>{accountingTxnLabel(type)}</dt>
                <dd>
                  {row.count} · {row.sum_amount}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </AppShell>
  );
}
