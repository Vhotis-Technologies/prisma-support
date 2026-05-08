export interface AccountingCurrencyTotalsRow {
  count: number;
  grand_total: string;
}

export interface AccountingTypeTotalsRow {
  count: number;
  sum_amount: string;
}

export interface AccountingMonthSummary {
  year_month: string;
  year: number;
  month: number;
  currency_totals: Record<string, AccountingCurrencyTotalsRow>;
  by_transaction_type: Record<string, AccountingTypeTotalsRow>;
  vat_by_currency: Record<string, Record<string, string>>;
}

/** Month detail: aggregates only (no per-transaction rows). */
export interface AccountingMonthDetail extends AccountingMonthSummary {
  transaction_count: number;
}

export interface AccountingSummariesApiEnvelope {
  data: {
    summaries: AccountingMonthSummary[];
  };
}

export interface AccountingDetailApiEnvelope {
  data: AccountingMonthDetail;
}
