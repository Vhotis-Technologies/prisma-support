import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AccountingMonthDetail,
  AccountingMonthSummary,
  AccountingDetailApiEnvelope,
  AccountingSummariesApiEnvelope,
} from "@/app/interfaces/AccountingInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 120;

export interface MonthlySummariesArg {
  months_back?: number;
  status?: string;
}

export interface MonthDetailArg {
  year: number;
  month: number;
  status?: string;
}

const accountingApi = createApi({
  reducerPath: "accountingApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["AccountingSummaries", "AccountingMonth"],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    getMonthlySummaries: builder.query<
      AccountingMonthSummary[],
      MonthlySummariesArg | void
    >({
      query: (arg) => ({
        url: "/api/v1/accounting/get_monthly_summaries/",
        method: "GET",
        params: {
          months_back: arg?.months_back ?? 24,
          status: arg?.status ?? "succeeded",
        },
      }),
      transformResponse: (response: AccountingSummariesApiEnvelope) =>
        response?.data?.summaries ?? [],
      providesTags: [{ type: "AccountingSummaries", id: "LIST" }],
    }),

    getMonthDetail: builder.query<AccountingMonthDetail, MonthDetailArg>({
      query: ({ year, month, status = "succeeded" }) => ({
        url: "/api/v1/accounting/get_month_detail/",
        method: "GET",
        params: { year, month, status },
      }),
      transformResponse: (response: AccountingDetailApiEnvelope) => {
        const d = response?.data;
        if (!d) throw new Error("Missing accounting detail");
        return d;
      },
      providesTags: (_r, _e, arg) => [
        { type: "AccountingMonth", id: `${arg.year}-${arg.month}` },
      ],
    }),
  }),
});

export const { useGetMonthlySummariesQuery, useGetMonthDetailQuery } =
  accountingApi;
export default accountingApi;
