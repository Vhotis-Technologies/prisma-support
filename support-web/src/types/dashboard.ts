export type DashboardTimeframe = "daily" | "30days" | "quarterly" | "yearly";

export type DashboardMetric = {
  label: string;
  value: number;
  difference: string;
  isIncrease: boolean;
  icon: string;
};

export type DashboardMetricsMeta = {
  timeframe: string;
  window_days: number;
};

export type DashboardMetricsResult = {
  metrics: DashboardMetric[];
  meta?: DashboardMetricsMeta;
};

export type DashboardDataEnvelope = {
  data?: {
    metrics?: DashboardMetric[];
    meta?: DashboardMetricsMeta;
  };
};
