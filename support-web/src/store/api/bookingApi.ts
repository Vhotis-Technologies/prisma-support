/** Appointments and fleet bulk orders. Paths: `SUPPORT_API.bookings*`. */
import { SUPPORT_API } from "../../lib/routes";
import type {
  BookingDetails,
  BulkOrderDetailResponse,
  CancelBookingResponse,
  CancelBulkOrderResponse,
  ReassignBookingRequest,
  ReassignBulkOrderRequest,
  ReassignmentAuditEntry,
  ReassignmentCandidatesPayload,
  ReassignmentResponse,
  RescheduleBookingRequest,
  RescheduleBulkOrderRequest,
  RescheduleIntentResponse,
  SupportBookingListRow,
} from "../../types/booking";
import { getData, patchData, postData } from "./client";
export async function getSupportBookingsList(): Promise<SupportBookingListRow[]> {
  const response = await getData<{ data?: { bookings?: unknown[] } }>(
    SUPPORT_API.bookingsList,
  );
  const rows = response.data?.bookings ?? [];
  return rows.map((row): SupportBookingListRow => {
    if (!row || typeof row !== "object") {
      throw new Error("Invalid booking row in API response");
    }
    const o = row as Record<string, unknown>;
    if (o.kind === "bulk_order" || o.kind === "appointment") {
      return row as SupportBookingListRow;
    }
    return Object.assign({ kind: "appointment" as const }, o) as SupportBookingListRow;
  });
}

export async function getSupportBookingDetail(bookingId: string): Promise<BookingDetails> {
  const response = await getData<{ data?: { booking?: BookingDetails } }>(
    SUPPORT_API.bookingDetail,
    { params: { booking_id: bookingId } },
  );
  const booking = response.data?.booking;
  if (!booking) throw new Error("Missing booking in response");
  return booking;
}

export async function getSupportBulkOrderDetail(
  bulkOrderId: string,
): Promise<BulkOrderDetailResponse> {
  const response = await getData<{ data?: BulkOrderDetailResponse }>(
    SUPPORT_API.bulkOrderDetail,
    { params: { bulk_order_id: bulkOrderId } },
  );
  const data = response.data;
  if (!data?.bulk_order) throw new Error("Missing bulk order in response");
  return data;
}

export async function getRescheduleSlots(bookingId: string, date: string): Promise<string[]> {
  const response = await getData<{ data?: { slots?: string[] } }>(
    SUPPORT_API.rescheduleSlots,
    { params: { booking_id: bookingId, date } },
  );
  return response.data?.slots ?? [];
}

export async function getBulkRescheduleSlots(
  bulkOrderId: string,
  date: string,
): Promise<string[]> {
  const response = await getData<{ data?: { slots?: string[] } }>(
    SUPPORT_API.bulkRescheduleSlots,
    { params: { bulk_order_id: bulkOrderId, date } },
  );
  return response.data?.slots ?? [];
}

export function cancelSupportBooking(booking_reference: string) {
  return patchData<CancelBookingResponse>(SUPPORT_API.cancelBooking, {
    booking_reference,
  });
}

export function cancelSupportBulkOrder(bulkOrderId: string) {
  return patchData<CancelBulkOrderResponse>(SUPPORT_API.cancelBulkOrder, {
    bulk_order_id: bulkOrderId,
  });
}

export function rescheduleIntent(body: {
  booking_reference: string;
  new_date: string;
  new_time: string;
}) {
  return patchData<RescheduleIntentResponse>(SUPPORT_API.rescheduleIntent, body);
}

export function rescheduleSupportBooking(body: RescheduleBookingRequest) {
  const { booking_reference, new_date, new_time, total_cost } = body;
  return patchData<{ message?: string }>(SUPPORT_API.rescheduleBooking, {
    booking_reference,
    new_date,
    new_time,
    ...(total_cost != null ? { total_cost } : {}),
  });
}

export function rescheduleSupportBulkOrder(body: RescheduleBulkOrderRequest) {
  return patchData<{ message?: string; error?: string }>(
    SUPPORT_API.rescheduleBulkOrder,
    {
      bulk_order_id: body.bulkOrderId,
      new_date: body.new_date,
      new_time: body.new_time,
    },
  );
}

export async function getReassignmentCandidates(
  bookingId: string,
): Promise<ReassignmentCandidatesPayload> {
  const response = await getData<{ data?: ReassignmentCandidatesPayload }>(
    SUPPORT_API.reassignmentCandidates,
    { params: { booking_id: bookingId } },
  );
  if (!response.data) throw new Error("Missing reassignment candidates in response");
  return response.data;
}

export async function getBulkReassignmentCandidates(
  bulkOrderId: string,
): Promise<ReassignmentCandidatesPayload> {
  const response = await getData<{ data?: ReassignmentCandidatesPayload }>(
    SUPPORT_API.bulkReassignmentCandidates,
    { params: { bulk_order_id: bulkOrderId } },
  );
  if (!response.data) {
    throw new Error("Missing bulk reassignment candidates in response");
  }
  return response.data;
}

export async function getReassignmentHistory(
  bookingReference: string,
): Promise<ReassignmentAuditEntry[]> {
  const response = await getData<{ data?: { history?: ReassignmentAuditEntry[] } }>(
    SUPPORT_API.reassignmentHistory,
    { params: { booking_reference: bookingReference } },
  );
  return response.data?.history ?? [];
}

export function reassignSupportBooking(body: ReassignBookingRequest) {
  const { bookingId, ...rest } = body;
  return patchData<ReassignmentResponse>(SUPPORT_API.reassignBooking, {
    booking_id: bookingId,
    ...rest,
  });
}

export function reassignSupportBulkOrder(body: ReassignBulkOrderRequest) {
  const { bulkOrderId, ...rest } = body;
  return patchData<ReassignmentResponse>(SUPPORT_API.reassignBulkOrder, {
    bulk_order_id: bulkOrderId,
    ...rest,
  });
}

export function resendGuestResultsEmail(bookingId: string) {
  return postData<{ message?: string; email_kind?: string }>(
    SUPPORT_API.resendGuestResultsEmail,
    { booking_id: bookingId },
  );
}
