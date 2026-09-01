export type SupportVehicleDetailVehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registration_number?: string;
  licence?: string;
  country?: string;
  image?: string | null;
  owner_count?: number;
};

export type SupportOwnershipTimelineEntry = {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  ownership_type: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
};

export type SupportVehicleTransferEntry = {
  id: string;
  status: string;
  from_owner_id: string;
  from_owner_name: string;
  from_owner_email: string;
  to_owner_id: string;
  to_owner_name: string;
  to_owner_email: string;
  requested_at: string;
  responded_at: string;
  expires_at: string;
  can_approve: boolean;
  can_reject: boolean;
};

export type SupportFleetLinkEntry = {
  fleet_vehicle_id: string;
  fleet_id: string;
  fleet_name: string;
  branch_id: string;
  branch_name: string;
};

export type SupportCurrentOwnerSummary = {
  ownership_id: string;
  user_id: string;
  name: string;
  email: string;
  ownership_type: string;
  start_date: string;
};

export type VehicleInspection = {
  id?: number;
  booking?: number;
  tire_tread_depth?: number | null;
  tire_condition?: string | null;
  wiper_status?: "good" | "needs_work" | "bad" | null;
  oil_level?: "good" | "low" | "needs_change" | "needs_refill" | null;
  coolant_level?: "good" | "low" | "needs_change" | "needs_refill" | null;
  brake_fluid_level?: "good" | "low" | "needs_change" | "needs_refill" | null;
  battery_condition?: "good" | "weak" | "replace" | null;
  headlights_status?: "working" | "dim" | "not_working" | null;
  taillights_status?: "working" | "dim" | "not_working" | null;
  indicators_status?: "working" | "not_working" | null;
  vehicle_condition_notes?: string | null;
  damage_report?: string | null;
  inspected_at?: string;
  appointment_date?: string;
  booking_reference?: string;
};

export type SupportVehicleStats = {
  vehicle: SupportVehicleDetailVehicle | null;
  total_bookings: number;
  total_amount: number;
  last_cleaned: string | null;
  next_recommended_service: string | null;
  latest_inspection?: VehicleInspection | null;
  ownership_timeline?: SupportOwnershipTimelineEntry[];
  vehicle_transfers?: SupportVehicleTransferEntry[];
  fleet_links?: SupportFleetLinkEntry[];
  current_owner?: SupportCurrentOwnerSummary | null;
};

export type SupportVehicleDetailResponse = {
  data?: SupportVehicleStats;
  error?: string;
};

export type SupportVehicleTransferResponse = {
  data?: {
    message: string;
    vehicle?: SupportVehicleStats;
  };
  error?: string;
};

export type VehicleTransferAction = "approve" | "reject";
