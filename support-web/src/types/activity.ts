export type ActivityType =
  | "booking"
  | "customer"
  | "fleet"
  | "partner"
  | "detailer"
  | "subscription"
  | "branch"
  | "vehicle"
  | "fleet_vehicle"
  | "transfer"
  | "payout";

export type ActivityItem = {
  id: string;
  activity_type: ActivityType;
  title: string;
  summary: string;
  timestamp: string;
  entity_id?: string;
};

export type ActivityFeedMeta = {
  limit: number;
  lookback_days: number | null;
};

export type ActivityFeedResult = {
  activities: ActivityItem[];
  meta?: ActivityFeedMeta;
};

export type GetActivityFeedArgs = {
  limit?: number;
  since?: string;
};
