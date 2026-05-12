export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type PaymentStatus =
  | "unpaid"
  | "paid"
  | "partial"
  | "refunded"
  | "invoice later";

/** Row shown on the bookings list (and base fields for full detail). */
export interface BookingItemProps {
  id: string;
  booking_reference: string;
  booking_date: string;
  appointment_date: string;
  status: BookingStatus;
  client_name: string;
  client_type: string;
}

/** Single-appointment row from support bookings API. */
export interface AppointmentListItem extends BookingItemProps {
  kind: "appointment";
}

/** One row per fleet bulk order in the support bookings list. */
export interface BulkOrderListItem {
  kind: "bulk_order";
  id: string;
  bulk_order_id: string;
  booking_reference: string;
  booking_date: string;
  appointment_date: string;
  status: BookingStatus;
  client_name: string;
  client_type: string;
  vehicle_count: number;
  total_amount: number;
}

export type SupportBookingListRow = AppointmentListItem | BulkOrderListItem;

export type BookingAddress = {
  address: string;
  city: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
};

/** Bulk order metadata from `get_bulk_order_detail`. */
export interface BulkOrderDetailPayload {
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
}

export interface BulkOrderPaymentSummary {
  payment_status: PaymentStatus | string;
  order_total: number;
  payments_total: number;
  refunds_total: number;
  bulk_payment_status: string;
}

export interface BulkOrderDetailResponse {
  bulk_order: BulkOrderDetailPayload;
  appointments: BookingDetails[];
  payment_summary: BulkOrderPaymentSummary;
}

/** Assigned Prisma crew / partner for a booking (support routing). */
export interface BookingTeamMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
}

export interface BookingImageItem {
  id: number;
  image_url: string;
  created_at: string;
}

export interface BookingImageGroups {
  before_images_interior: BookingImageItem[];
  before_images_exterior: BookingImageItem[];
  after_images_interior: BookingImageItem[];
  after_images_exterior: BookingImageItem[];
}

/** Full booking record for support: detail screen + mock/API. */
export interface BookingDetails extends BookingItemProps {
  kind?: "appointment";
  /** ISO date YYYY-MM-DD for reschedule APIs */
  appointment_date_iso?: string;
  /** HH:MM from server for reschedule */
  start_time_hhmm?: string;
  client_email: string;
  client_phone: string;
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
}

/** Props for the `BookingItem` list component (onPress is UI-only). */
export interface BookingItemComponentProps {
  booking: SupportBookingListRow;
  onPress?: (booking: SupportBookingListRow) => void;
}
