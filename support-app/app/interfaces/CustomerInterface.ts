export type CustomerType = "b2c" | "fleet" | "partner";

/** Support app customer list tab / `get_customers_list` segment query param. */
export type CustomerSegment = "b2c" | "fleets" | "partners";

export interface CustomerAddress {
  address: string;
  city: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CustomerContact {
  email: string;
  phone: string;
}

export interface CustomerBase {
  id: string;
  type: CustomerType;
  name: string;
  contact: CustomerContact;
}

export interface B2CListItem extends CustomerBase {
  type: "b2c";
  loyalty_tier: string;
  total_spend: number;
  total_bookings: number;
}

export interface B2CDetails extends B2CListItem {
  address: CustomerAddress;
  no_of_vehicles: number;
  vehicles?: Vehicle[];
  last_booking_date: string;
  average_booking_value: number;
  completed_bookings: number;
  cancelled_bookings: number;
  preferred_services: string[];
  notes?: string;
}

export interface FleetListItem extends CustomerBase {
  type: "fleet";
  fleet_owner: string;
  no_of_branches: number;
  no_of_admins: number;
  total_vehicles: number;
  subscription: FleetSubscription;
}

export type FleetSubscriptionStatus = "active" | "terminated" | "expired";

/** e.g. "basic", "pro", "enterprise" — free-form label from backend */
export type FleetBillingType = "monthly" | "yearly";

export interface FleetSubscription {
  /** Plan tier / product name */
  subtype: string;
  billing_type: FleetBillingType;
  started_at: string;
  ends_at: string;
  is_trial: boolean;
  /** Present when `is_trial` is true — when the trial period ends */
  trial_ends_at?: string;
  status: FleetSubscriptionStatus;
  terminated_at?: string;
}

export interface FleetBranchSummary {
  id: string;
  name: string;
  city?: string;
  vehicle_count: number;
  booking_count: number;
  admin_count: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  color: string;
  vin: string;
  image_url: string;
  status: "active" | "maintenance" | "inactive";
  last_service_date: string;
}

export interface ReferredUserDetails extends B2CDetails {
  partner_id: string;
  joined_at: string;
  last_active_date: string;
  referred_status: "active" | "inactive" | "churned";
  vehicles: Vehicle[];
}

export interface FleetBranchDetails extends FleetBranchSummary {
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
}

export interface FleetAdminSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch_name: string;
}

export interface FleetDetails extends FleetListItem {
  total_spend: number;
  total_bookings: number;
  referral_code: string;
  branches: FleetBranchSummary[];
  admins: FleetAdminSummary[];
}

export interface PartnerListItem extends CustomerBase {
  type: "partner";
  business_name: string;
  referral_code: string;
  total_referred: number;
}

/** Vehicle row in partner support view: one referred user may own many vehicles */
export interface PartnerReferredVehicleEntry {
  referredUserId: string;
  referredUserName: string;
  vehicle: Vehicle;
}

export interface PartnerDetails extends PartnerListItem {
  /** Django Auth `User` id for the partner login; used for support vehicle removal on this account. */
  user_id?: string;
  /** Vehicles owned by the partner user account (not referred users). */
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
}

/** Row union returned by support `get_customers_list` (after parsing `type`). */
export type SupportCustomerListItem = B2CListItem | FleetListItem | PartnerListItem;

// --- Support customer API envelopes & mutation contracts (RTK / Django proxy) ---

export interface SupportCustomersListData {
  customers?: unknown[];
}

export interface SupportCustomersListResponse {
  data?: SupportCustomersListData;
}

export interface SupportB2cDetailResponse {
  data?: { customer?: B2CDetails };
}

export interface SupportFleetDetailResponse {
  data?: { customer?: FleetDetails };
}

export interface SupportPartnerDetailResponse {
  data?: { customer?: PartnerDetails };
}

export interface SupportFleetBranchDetailResponse {
  data?: { branch?: FleetBranchDetails };
}

export interface SupportPartnerReferredUsersResponse {
  data?: { users?: ReferredUserDetails[] };
}

export interface FleetSubscriptionMutationPayload {
  message?: string;
  customer?: FleetDetails;
}

export interface TerminateFleetSubscriptionResponse {
  data?: FleetSubscriptionMutationPayload;
}

export interface RenewFleetSubscriptionResponse {
  data?: FleetSubscriptionMutationPayload;
}

export interface RemoveSupportVehicleResponse {
  data?: { message?: string };
}

export interface RemoveSupportBranchResponse {
  data?: { message?: string };
}

export interface TerminateFleetSubscriptionArg {
  fleetId: string;
  reason?: string;
}

export interface RenewFleetSubscriptionArg {
  fleetId: string;
}

export interface RemoveSupportVehicleArg {
  vehicleId: string;
  fleetId?: string;
  userId?: string;
  /** When set, invalidates partner detail cache after removing a partner-account vehicle. */
  partnerId?: string;
}

export interface RemoveSupportBranchArg {
  fleetId: string;
  branchId: string;
}

export interface SupportFleetBranchQueryArg {
  fleetId: string;
  branchId: string;
}

/** `useCustomerFlow` return shape by segment. */
export type UseCustomerFlowResult<Seg extends CustomerSegment> = {
  customer: Seg extends "b2c"
    ? B2CDetails | undefined
    : Seg extends "fleets"
      ? FleetDetails | undefined
      : PartnerDetails | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
  terminateSubscription: (reason?: string) => Promise<void>;
  renewSubscription: () => Promise<void>;
  removeVehicle: (args: RemoveSupportVehicleArg) => Promise<void>;
  removeBranch: (fleetId: string, branchId: string) => Promise<void>;
  terminateSubscriptionLoading: boolean;
  renewSubscriptionLoading: boolean;
  removeVehicleLoading: boolean;
  removeBranchLoading: boolean;
};

export interface B2CCustomerRowProps {
  customer: B2CListItem;
  onPress?: (customer: B2CListItem) => void;
}

export interface FleetCustomerRowProps {
  customer: FleetListItem;
  onPress?: (customer: FleetListItem) => void;
}

export interface PartnerCustomerRowProps {
  customer: PartnerListItem;
  onPress?: (customer: PartnerListItem) => void;
}
