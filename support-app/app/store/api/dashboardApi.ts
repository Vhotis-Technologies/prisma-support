import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "../baseQuery";

export type DashboardTimeframe =
  | "daily"
  | "30days"
  | "quarterly"
  | "yearly";

export interface DashboardMetric {
  label: string;
  value: number;
  difference: string;
  isIncrease: boolean;
  icon: string;
}

/** Echoed from client API so the UI can confirm lookback + refetch. */
export interface DashboardMetricsMeta {
  timeframe: string;
  window_days: number;
}

export interface DashboardMetricsResult {
  metrics: DashboardMetric[];
  meta?: DashboardMetricsMeta;
}

const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["DashboardData"],
  endpoints: (builder) => ({
    getDashboardMetrics: builder.query<
      DashboardMetricsResult,
      DashboardTimeframe
    >({
      query: (timeframe) => ({
        url: "/api/v1/dashboard/get_dashboard_data/",
        method: "GET",
        params: { timeframe },
      }),
      transformResponse: (response: {
        data?: {
          metrics?: DashboardMetric[];
          meta?: DashboardMetricsMeta;
        };
      }): DashboardMetricsResult => ({
        metrics: response.data?.metrics ?? [],
        meta: response.data?.meta,
      }),
      providesTags: (_result, _error, timeframe) => [
        { type: "DashboardData", id: timeframe },
      ],
    }),
  }),
});

export const { useGetDashboardMetricsQuery } = dashboardApi;
export default dashboardApi;
