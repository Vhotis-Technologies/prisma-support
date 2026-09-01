export type AccountingCurrencyTotalsRow = {
  count: number;
  grand_total: string;
};

export type AccountingTypeTotalsRow = {
  count: number;
  sum_amount: string;
};

export type AccountingMonthSummary = {
  year_month: string;
  year: number;
  month: number;
  currency_totals: Record<string, AccountingCurrencyTotalsRow>;
  by_transaction_type: Record<string, AccountingTypeTotalsRow>;
  vat_by_currency: Record<string, Record<string, string>>;
};

export type AccountingMonthDetail = AccountingMonthSummary & {
  transaction_count: number;
};

export type MonthlySummariesArg = {
  months_back?: number;
  status?: string;
};

export type MonthDetailArg = {
  year: number;
  month: number;
  status?: string;
};
