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
  confirmed_amount?: number;
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
  /** When "paid", emphasize completion date and reference instead of initiated date. */
  variant?: "paid" | "pending";
}

export interface CrewPayoutDetailResponse {
  data?: { payout?: CrewPayoutQueueItem };
}

/** Aggregated unpaid earnings for a single crew member. */
export interface CrewUnpaidSummary {
  crew_member_id: string;
  crew_member_name: string;
  crew_member_email: string;
  unpaid_amount: number;
  unpaid_job_count: number;
  latest_earning_at: string;
  latest_earning_at_display: string;
}

export interface CrewUnpaidSummaryResponse {
  data?: { crew_unpaid_earnings?: CrewUnpaidSummary[] };
}

export interface CrewUnpaidEarning {
  id: string;
  job_id: string | null;
  job_reference: string;
  client_name: string;
  service_type: string;
  gross_amount: number;
  net_amount: number;
  total_active_hours: number;
  total_inactive_hours: number;
  created_at: string;
  created_at_display: string;
}

export interface CrewBankAccount {
  has_bank_account: boolean;
  account_name: string;
  iban_masked?: string;
  is_primary?: boolean;
  is_verified?: boolean;
}

export interface CrewUnpaidDetail {
  crew_member_id: string;
  crew_member_name: string;
  crew_member_email: string;
  unpaid_amount: number;
  unpaid_job_count: number;
  earnings: CrewUnpaidEarning[];
  bank_account?: CrewBankAccount;
}

export interface CrewUnpaidDetailResponse {
  data?: CrewUnpaidDetail;
}

export interface CreateCrewPayoutArg {
  crew_member_id: string;
  earning_ids?: string[];
  admin_notes?: string;
}

export interface CreateCrewPayoutResponse {
  data?: {
    message?: string;
    payout?: CrewPayoutQueueItem;
  };
}

export interface RecordCrewPaymentMadeArg {
  crew_member_id: string;
  earning_ids?: string[];
  admin_notes?: string;
  payment_reference?: string;
}

export interface RecordCrewPaymentMadeResponse {
  data?: {
    message?: string;
    payout?: CrewPayoutQueueItem;
    earnings_marked_paid?: number;
  };
}

/** Live partner ledger balances used by support before marking a request paid. */
export interface PartnerBalance {
  partner_id: string;
  partner_name: string;
  approved_balance: number;
  pending_balance: number;
  total_paid: number;
  amount_requested: number | null;
  amount_matches_balance: boolean;
  bank_account: {
    has_bank_account: boolean;
    account_holder_name?: string;
    iban_masked?: string;
  };
}

export interface PartnerBalanceResponse {
  data?: PartnerBalance;
}

export interface CrewUnpaidSummaryItemProps {
  item: CrewUnpaidSummary;
  onPress?: (item: CrewUnpaidSummary) => void;
}
