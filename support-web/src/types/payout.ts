export type PartnerPayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "cancelled";

export type PartnerPayoutQueueItem = {
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
};

export type CrewPayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type CrewPayoutQueueItem = {
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
};

export type PayoutTabKind = "partner" | "crew";

export type MarkPartnerPayoutPaidArg = {
  payout_request_id: string;
  admin_notes?: string;
  payment_reference?: string;
  confirmed_amount?: number;
};

export type MarkCrewPayoutPaidArg = {
  payout_request_id: string;
  admin_notes?: string;
  payment_reference?: string;
};

export type CrewUnpaidSummary = {
  crew_member_id: string;
  crew_member_name: string;
  crew_member_email: string;
  unpaid_amount: number;
  unpaid_job_count: number;
  latest_earning_at: string;
  latest_earning_at_display: string;
};

export type CrewUnpaidEarning = {
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
};

export type CrewBankAccount = {
  has_bank_account: boolean;
  account_name: string;
  iban_masked?: string;
  is_primary?: boolean;
  is_verified?: boolean;
};

export type CrewUnpaidDetail = {
  crew_member_id: string;
  crew_member_name: string;
  crew_member_email: string;
  unpaid_amount: number;
  unpaid_job_count: number;
  earnings: CrewUnpaidEarning[];
  bank_account?: CrewBankAccount;
};

export type CreateCrewPayoutArg = {
  crew_member_id: string;
  earning_ids?: string[];
  admin_notes?: string;
};

export type CreateCrewPayoutResponse = {
  data?: {
    message?: string;
    payout?: CrewPayoutQueueItem;
  };
};

export type RecordCrewPaymentMadeArg = {
  crew_member_id: string;
  earning_ids?: string[];
  admin_notes?: string;
  payment_reference?: string;
};

export type RecordCrewPaymentMadeResult = {
  message?: string;
  payout?: CrewPayoutQueueItem;
  earnings_marked_paid?: number;
};

export type PartnerBalance = {
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
};
