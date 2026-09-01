export type CustomerType = "b2c" | "fleet" | "partner";

export type CustomerSegment = "b2c" | "guests" | "fleets" | "partners";

export type CustomerAddress = {
  address: string;
  city: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type CustomerContact = {
  email: string;
  phone: string;
};

export type CustomerBase = {
  id: string;
  type: CustomerType;
  name: string;
  contact: CustomerContact;
};

export type FleetSubscriptionStatus =
  | "active"
  | "terminated"
  | "expired"
  | "trialing"
  | "pending"
  | "past_due";

export type FleetBillingType = "monthly" | "yearly";

export type FleetSubscription = {
  subtype: string;
  billing_type: FleetBillingType;
  started_at: string;
  ends_at: string;
  is_trial: boolean;
  trial_ends_at?: string;
  last_paid_at?: string | null;
  status: FleetSubscriptionStatus;
  terminated_at?: string;
};

export type B2CListItem = CustomerBase & {
  type: "b2c";
  is_guest?: boolean;
  account_status?: "guest" | "member";
  can_claim?: boolean;
  loyalty_tier: string;
  total_spend: number;
  total_bookings: number;
  subscription: FleetSubscription;
};

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export type LoyaltyProgressSnapshot = {
  is_b2c: boolean;
  current_tier: LoyaltyTier | null;
  completed_bookings: number;
  next_tier: LoyaltyTier | null;
  current_threshold: number;
  next_threshold: number | null;
  washes_to_next: number;
  tier_thresholds: Record<LoyaltyTier, number>;
  benefits: { discount: number; free_service: string[] };
};

export type SubscriptionComplimentarySnapshot = {
  eligible_subscription: boolean;
  remaining_subscription: number;
  max_subscription: number;
  period_start: string | null;
  period_end: string | null;
  period_label: string;
};

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  color: string;
  image_url: string;
  status: "active" | "maintenance" | "inactive";
  last_service_date: string;
};

export type B2CDetails = B2CListItem & {
  address: CustomerAddress;
  no_of_vehicles: number;
  vehicles?: Vehicle[];
  last_booking_date: string;
  average_booking_value: number;
  completed_bookings: number;
  cancelled_bookings: number;
  preferred_services: string[];
  notes?: string;
  loyalty?: LoyaltyProgressSnapshot;
  subscription_complimentary?: SubscriptionComplimentarySnapshot;
};

export type FleetListItem = CustomerBase & {
  type: "fleet";
  fleet_owner: string;
  no_of_branches: number;
  no_of_admins: number;
  total_vehicles: number;
  subscription: FleetSubscription;
};

export type FleetBranchSummary = {
  id: string;
  name: string;
  city?: string;
  vehicle_count: number;
  booking_count: number;
  admin_count: number;
};

export type FleetAdminSummary = {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch_name: string;
};

export type FleetDetails = FleetListItem & {
  total_spend: number;
  total_bookings: number;
  referral_code: string;
  branches: FleetBranchSummary[];
  admins: FleetAdminSummary[];
};

export type FleetBranchDetails = FleetBranchSummary & {
  fleet_id: string;
  manager_name: string;
  manager_email: string;
  manager_phone: string;
  address: CustomerAddress;
  spend_limit: number;
  spent_this_month: number;
  average_booking_value: number;
  completion_rate: number;
  vehicles: Vehicle[];
};

export type ReferredUserDetails = B2CDetails & {
  partner_id: string;
  joined_at: string;
  last_active_date: string;
  referred_status: "active" | "inactive" | "churned";
  vehicles: Vehicle[];
};

export type PartnerListItem = CustomerBase & {
  type: "partner";
  business_name: string;
  referral_code: string;
  total_referred: number;
};

export type PartnerReferredVehicleEntry = {
  referredUserId: string;
  referredUserName: string;
  vehicle: Vehicle;
};

export type PartnerBankAccountSummary = {
  has_bank_account: boolean;
  account_holder_name?: string;
  iban_masked?: string;
};

export type PartnerPayoutRequest = {
  id: string;
  amount_requested: number;
  status: "pending" | "processing" | "paid" | "cancelled";
  requested_at: string;
  requested_at_display: string;
  paid_at: string | null;
  paid_at_display: string;
  admin_notes: string;
};

export type PartnerDetails = PartnerListItem & {
  user_id?: string;
  vehicles?: Vehicle[];
  address: CustomerAddress;
  total_spend: number;
  last_booking_date: string;
  active_referred: number;
  churned_referred: number;
  conversion_rate: number;
  vehicles_registered: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  revenue_total: number;
  revenue_this_month: number;
  commission_total_earned: number;
  commission_pending: number;
  commission_paid: number;
  bank_account_summary?: PartnerBankAccountSummary;
  payout_requests?: PartnerPayoutRequest[];
  open_payout_total?: number;
};

export type SupportCustomerListItem = B2CListItem | FleetListItem | PartnerListItem;

export type TerminateFleetSubscriptionArg = {
  fleetId: string;
  reason?: string;
};

export type RenewFleetSubscriptionArg = {
  fleetId: string;
};

export type TerminateB2cSubscriptionArg = {
  userId: string;
  reason?: string;
};

export type RenewB2cSubscriptionArg = {
  userId: string;
};

export type RemoveSupportVehicleArg = {
  vehicleId: string;
  fleetId?: string;
  userId?: string;
  partnerId?: string;
};

export type RemoveSupportBranchArg = {
  fleetId: string;
  branchId: string;
};

export type SupportFleetBranchQueryArg = {
  fleetId: string;
  branchId: string;
};

export type DeleteUserAccountArg = {
  user_id: string;
  reason?: string;
};

export type DeleteUserAccountResult = {
  message?: string;
  user_id?: string;
  deleted_by?: string;
};

export type FleetSubscriptionMutationPayload = {
  message?: string;
  customer?: FleetDetails;
};

export type B2cSubscriptionMutationPayload = {
  message?: string;
  customer?: B2CDetails;
};
