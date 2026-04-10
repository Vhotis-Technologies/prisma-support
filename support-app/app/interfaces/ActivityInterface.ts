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

/** Single timeline row from the support activity feed (API / Redis-backed later). */
export default interface ActivityInterface {
  id: string;
  activity_type: ActivityType;
  title: string;
  summary: string;
  timestamp: string;
  entity_id?: string;
}

export interface ActivityItemComponentProps {
  activity: ActivityInterface;
  onPress?: (activity: ActivityInterface) => void;
}
