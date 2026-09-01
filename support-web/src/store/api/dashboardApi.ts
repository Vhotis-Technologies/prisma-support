/** Metrics from the client API via the support server proxy. */
import { SUPPORT_API } from "../../lib/routes";
import type {
  DashboardDataEnvelope,
  DashboardMetricsResult,
  DashboardTimeframe,
} from "../../types/dashboard";
import { getData } from "./client";

export async function getDashboardMetrics(
  timeframe: DashboardTimeframe,
): Promise<DashboardMetricsResult> {
  const response = await getData<DashboardDataEnvelope>(SUPPORT_API.dashboardData, {
    params: { timeframe },
  });
  return {
    metrics: response.data?.metrics ?? [],
    meta: response.data?.meta,
  };
}
