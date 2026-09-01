/** Monthly accounting summaries (succeeded payments). */
import { SUPPORT_API } from "../../lib/routes";
import type {
  AccountingMonthDetail,
  AccountingMonthSummary,
  MonthDetailArg,
  MonthlySummariesArg,
} from "../../types/accounting";
import { getData } from "./client";

export async function getMonthlySummaries(
  arg?: MonthlySummariesArg,
): Promise<AccountingMonthSummary[]> {
  const response = await getData<{ data?: { summaries?: AccountingMonthSummary[] } }>(
    SUPPORT_API.accountingSummaries,
    {
      params: {
        months_back: arg?.months_back ?? 24,
        status: arg?.status ?? "succeeded",
      },
    },
  );
  return response.data?.summaries ?? [];
}

export async function getMonthDetail(arg: MonthDetailArg): Promise<AccountingMonthDetail> {
  const response = await getData<{ data?: AccountingMonthDetail }>(
    SUPPORT_API.accountingMonthDetail,
    {
      params: {
        year: arg.year,
        month: arg.month,
        status: arg.status ?? "succeeded",
      },
    },
  );
  if (!response.data) throw new Error("Missing accounting detail");
  return response.data;
}
