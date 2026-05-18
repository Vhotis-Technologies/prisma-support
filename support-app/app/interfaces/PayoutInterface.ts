/** Partner payout row from support queue API. */
export interface PartnerPayoutQueueItem {
  id: string;
  partner_id: string | null;
  partner_name: string;
  partner_user_email: string;
  amount_requested: number;
  status: PartnerPayoutStatus;
  requested_at: string;
  requested_at_display: string;
  paid_at: string | null;
  paid_at_display: string;
  admin_notes: string;
}

export type PartnerPayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "cancelled";

/** Crew payout row from detailer support queue API. */
export interface CrewPayoutQueueItem {
  id: string;
  crew_member_id: string | null;
  crew_member_name: string;
  crew_member_email: string;
  amount: number;
  status: CrewPayoutStatus;
  payment_type: "request" | "scheduled";
  pay_frequency_label: string;
  period_start: string;
  period_end: string;
  period_start_display: string;
  period_end_display: string;
  requested_at: string;
  requested_at_display: string;
  paid_at: string | null;
  paid_at_display: string;
  admin_notes: string;
  payout_reference: string;
}

export type CrewPayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type PayoutTabKind = "partner" | "crew";

export interface PartnerPayoutQueueResponse {
  data?: { payout_requests?: PartnerPayoutQueueItem[] };
}

export interface CrewPayoutQueueResponse {
  data?: { payout_requests?: CrewPayoutQueueItem[] };
}

export interface MarkPartnerPayoutPaidArg {
  payout_request_id: string;
  admin_notes?: string;
  payment_reference?: string;
}

export interface MarkCrewPayoutPaidArg {
  payout_request_id: string;
  admin_notes?: string;
  payment_reference?: string;
}

export interface PartnerPayoutItemProps {
  item: PartnerPayoutQueueItem;
  onPress?: (item: PartnerPayoutQueueItem) => void;
}

export interface CrewPayoutItemProps {
  item: CrewPayoutQueueItem;
  onPress?: (item: CrewPayoutQueueItem) => void;
}
