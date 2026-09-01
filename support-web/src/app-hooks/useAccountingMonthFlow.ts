/**
 * One calendar month of accounting aggregates (no per-transaction rows).
 * @module app-hooks/useAccountingMonthFlow
 */
import { useCallback, useEffect, useState } from "react";
import { getMonthDetail } from "../store/api/accountingApi";
import type { AccountingMonthDetail } from "../types/accounting";
import { loadError, type LoadState } from "../lib/load";

type Cache = { year: number; month: number; state: LoadState<AccountingMonthDetail> };

export function useAccountingMonthFlow(year: number, month: number, paramsOk: boolean) {
  const [cache, setCache] = useState<Cache>({
    year: 0,
    month: 0,
    state: { status: "loading" },
  });

  useEffect(() => {
    if (!paramsOk) return;
    let cancelled = false;
    void getMonthDetail({ year, month, status: "succeeded" })
      .then((data) => {
        if (!cancelled) setCache({ year, month, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            year,
            month,
            state: { status: "error", message: loadError(err, "Could not load this month") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [month, paramsOk, year]);

  const matched = cache.year === year && cache.month === month;
  const detail = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = paramsOk && (!matched || cache.state.status === "loading");
  const isError = !paramsOk || (matched && cache.state.status === "error");
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : "Could not load this month.";

  const refetch = useCallback(() => {
    if (!paramsOk) return;
    void getMonthDetail({ year, month, status: "succeeded" })
      .then((data) => setCache({ year, month, state: { status: "ok", data } }))
      .catch((err: unknown) => {
        setCache({
          year,
          month,
          state: { status: "error", message: loadError(err, "Could not load this month") },
        });
      });
  }, [month, paramsOk, year]);

  return { detail, isLoading, isError, errorMessage, refetch };
}
