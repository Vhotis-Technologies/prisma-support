/**
 * Monthly accounting summaries (succeeded payments, 36-month lookback).
 * @module app-hooks/useAccountingListFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMonthlySummaries } from "../store/api/accountingApi";
import type { AccountingMonthSummary } from "../types/accounting";
import { loadError, type LoadState } from "../lib/load";

function sortNewest(rows: AccountingMonthSummary[]): AccountingMonthSummary[] {
  return [...rows].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export function useAccountingListFlow() {
  const [rows, setRows] = useState<LoadState<AccountingMonthSummary[]>>({
    status: "loading",
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getMonthlySummaries({ months_back: 36, status: "succeeded" })
      .then((data) => {
        if (!cancelled) setRows({ status: "ok", data: sortNewest(data) });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows({
            status: "error",
            message: loadError(
              err,
              "Could not load accounting. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
            ),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void getMonthlySummaries({ months_back: 36, status: "succeeded" })
      .then((data) => setRows({ status: "ok", data: sortNewest(data) }))
      .catch((err: unknown) => {
        setRows({
          status: "error",
          message: loadError(err, "Could not load accounting"),
        });
      })
      .finally(() => setRefreshing(false));
  }, []);

  const summaries = useMemo(
    () => (rows.status === "ok" ? rows.data : []),
    [rows],
  );

  return { rows, summaries, refreshing, onRefresh };
}
