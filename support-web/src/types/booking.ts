export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "partial"
  | "refunded"
  | "invoice later";

export type BookingListBase = {
  id: string;
  booking_reference: string;
  booking_date: string;
  appointment_date: string;
  status: BookingStatus;
  client_name: string;
  client_type: string;
  is_guest?: boolean;
  client_user_id?: string;
  account_status?: "guest" | "member";
};

export type GuestAccessSnapshot = {
  status: "active" | "expired" | "revoked" | "none";
  expires_at: string | null;
  last_used_at: string | null;
};

export type AppointmentListItem = BookingListBase & {
  kind: "appointment";
};

export type BulkOrderListItem = {
  kind: "bulk_order";
  id: string;
  bulk_order_id: string;
  booking_reference: string;
  booking_date: string;
  appointment_date: string;
  status: BookingStatus;
  client_name: string;
  client_type: string;
  is_guest?: boolean;
  client_user_id?: string;
  account_status?: "guest" | "member";
  vehicle_count: number;
  total_amount: number;
};

export type SupportBookingListRow = AppointmentListItem | BulkOrderListItem;

export type BookingAddress = {
  address: string;
  city: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type BulkOrderDetailPayload = {
  id: string;
  booking_reference: string;
  payment_status: string;
  total_amount: number;
  number_of_vehicles: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_type: string;
  address: BookingAddress | null;
};

export type BulkOrderPaymentSummary = {
  payment_status: PaymentStatus | string;
  order_total: number;
  payments_total: number;
  refunds_total: number;
  bulk_payment_status: string;
};

export type BookingTeamMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
};

export type BookingImageItem = {
  id: number;
  image_url: string;
  created_at: string;
};

export type BookingImageGroups = {
  before_images_interior: BookingImageItem[];
  before_images_exterior: BookingImageItem[];
  after_images_interior: BookingImageItem[];
  after_images_exterior: BookingImageItem[];
};

export type BookingDetails = BookingListBase & {
  kind?: "appointment";
  appointment_date_iso?: string;
  start_time_hhmm?: string;
  client_email: string;
  client_phone: string;
  can_claim?: boolean;
  guest_access?: GuestAccessSnapshot | null;
  service_type: string;
  valet_type: string;
  service_description?: string;
  address: BookingAddress;
  duration_minutes: number;
  team_members: BookingTeamMember[];
  payment_status: PaymentStatus;
  loyalty_tier: string;
  loyalty_benefits: string[];
  is_express_service: boolean;
  addons: string[];
  special_instructions: string;
  total_amount: number;
  booking_images?: BookingImageGroups;
  is_reviewed?: boolean;
  review_rating?: number | null;
  review_comment?: string | null;
  review_submitted_at?: string | null;
};

export type BulkOrderDetailResponse = {
  bulk_order: BulkOrderDetailPayload;
  appointments: BookingDetails[];
  payment_summary: BulkOrderPaymentSummary;
};

export type ReassignmentReasonCode =
  | "illness"
  | "emergency"
  | "vehicle_issue"
  | "no_show"
  | "schedule_conflict"
  | "other";

export type ReassignmentCandidate = {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  image: string | null;
};

export type ReassignmentCandidatesPayload = {
  booking_reference: string;
  is_bulk: boolean;
  is_express: boolean;
  job_count: number;
  required_count: number;
  current_detailer_ids: string[];
  candidates: ReassignmentCandidate[];
};

export type ReassignmentAuditEntry = {
  id: string;
  booking_reference: string;
  is_bulk: boolean;
  is_express: boolean;
  job_count: number;
  old_detailer_ids: string[];
  new_detailer_ids: string[];
  reason_code: ReassignmentReasonCode;
  reason_notes: string;
  support_user_id: string;
  support_user_email: string;
  previous_status: string;
  created_at: string;
};

export type RescheduleIntentResponse = {
  requires_fee: boolean;
  fee_amount_cents: number;
  slot_valid: boolean;
};

export type CancelBookingResponse = {
  message: string;
  booking_status: string;
  refund: Record<string, unknown>;
  hours_until_appointment: number;
};

export type CancelBulkOrderResponse = {
  message?: string;
  refund_amount?: number | null;
  error?: string;
};

export type ReassignBookingRequest = {
  bookingId: string;
  new_detailer_ids: string[];
  reason_code: ReassignmentReasonCode;
  reason_notes?: string;
  support_user_id?: string;
  support_user_email?: string;
};

export type ReassignBulkOrderRequest = {
  bulkOrderId: string;
  new_detailer_ids: string[];
  reason_code: ReassignmentReasonCode;
  reason_notes?: string;
  support_user_id?: string;
  support_user_email?: string;
};

export type ReassignmentResponse = {
  message?: string;
  data?: {
    booking_reference?: string;
    is_bulk?: boolean;
    is_express?: boolean;
    old_detailer_ids?: string[];
    assigned_detailers?: Array<{
      id: string | null;
      name: string;
      phone: string;
      rating: number;
      image: string | null;
    }>;
    job_count?: number;
  };
  error?: string;
};

export type RescheduleBookingRequest = {
  bookingId: string;
  booking_reference: string;
  new_date: string;
  new_time: string;
  total_cost?: number;
};

export type RescheduleBulkOrderRequest = {
  bulkOrderId: string;
  new_date: string;
  new_time: string;
};
