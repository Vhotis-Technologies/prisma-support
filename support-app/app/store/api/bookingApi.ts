import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  BookingDetails,
  BulkOrderDetailResponse,
  ReassignmentAuditEntry,
  ReassignmentCandidatesPayload,
  ReassignmentReasonCode,
  SupportBookingListRow,
} from "@/app/interfaces/BookingInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 600;

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

const bookingApi = createApi({
  reducerPath: "bookingApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["SupportBookings", "SupportBooking"],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    getSupportBookingsList: builder.query<SupportBookingListRow[], void>({
      query: () => ({
        url: "/api/v1/bookings/get_bookings_list/",
        method: "GET",
      }),
      transformResponse: (response: { data?: { bookings?: unknown[] } }) => {
        const rows = response.data?.bookings ?? [];
        return rows.map((row): SupportBookingListRow => {
          if (!row || typeof row !== "object") {
            throw new Error("Invalid booking row in API response");
          }
          const o = row as Record<string, unknown>;
          if (o.kind === "bulk_order" || o.kind === "appointment") {
            return row as SupportBookingListRow;
          }
          return Object.assign({ kind: "appointment" as const }, o) as unknown as SupportBookingListRow;
        });
      },
      providesTags: [{ type: "SupportBookings", id: "LIST" }],
    }),

    getSupportBookingDetail: builder.query<BookingDetails, string>({
      query: (bookingId) => ({
        url: "/api/v1/bookings/get_booking_detail/",
        method: "GET",
        params: { booking_id: bookingId },
      }),
      transformResponse: (response: { data?: { booking?: BookingDetails } }) => {
        const b = response.data?.booking;
        if (!b) throw new Error("Missing booking in response");
        return b;
      },
      providesTags: (_result, _err, bookingId) => [
        { type: "SupportBooking", id: bookingId },
      ],
    }),

    getSupportBulkOrderDetail: builder.query<BulkOrderDetailResponse, string>({
      query: (bulkOrderId) => ({
        url: "/api/v1/bookings/get_bulk_order_detail/",
        method: "GET",
        params: { bulk_order_id: bulkOrderId },
      }),
      transformResponse: (response: { data?: BulkOrderDetailResponse }) => {
        const d = response.data;
        if (!d?.bulk_order) throw new Error("Missing bulk order in response");
        return d;
      },
      providesTags: (_result, _err, bulkOrderId) => [
        { type: "SupportBooking", id: `bulk-${bulkOrderId}` },
      ],
    }),

    getRescheduleSlots: builder.query<string[], { bookingId: string; date: string }>({
      query: ({ bookingId, date }) => ({
        url: "/api/v1/bookings/get_reschedule_slots/",
        method: "GET",
        params: { booking_id: bookingId, date },
      }),
      transformResponse: (response: { data?: { slots?: string[] } }) =>
        response.data?.slots ?? [],
    }),

    getBulkRescheduleSlots: builder.query<string[], { bulkOrderId: string; date: string }>({
      query: ({ bulkOrderId, date }) => ({
        url: "/api/v1/bookings/get_bulk_reschedule_slots/",
        method: "GET",
        params: { bulk_order_id: bulkOrderId, date },
      }),
      transformResponse: (response: { data?: { slots?: string[] } }) =>
        response.data?.slots ?? [],
    }),

    cancelSupportBooking: builder.mutation<
      CancelBookingResponse,
      { bookingId: string; booking_reference: string }
    >({
      query: ({ booking_reference }) => ({
        url: "/api/v1/bookings/cancel_booking/",
        method: "PATCH",
        data: { booking_reference },
      }),
      invalidatesTags: (_result, _error, { bookingId }) => [
        { type: "SupportBookings", id: "LIST" },
        { type: "SupportBooking", id: bookingId },
      ],
    }),

    cancelSupportBulkOrder: builder.mutation<
      { message?: string; refund_amount?: number | null; error?: string },
      { bulkOrderId: string }
    >({
      query: ({ bulkOrderId }) => ({
        url: "/api/v1/bookings/cancel_bulk_order/",
        method: "PATCH",
        data: { bulk_order_id: bulkOrderId },
      }),
      invalidatesTags: (_result, _error, { bulkOrderId }) => [
        { type: "SupportBookings", id: "LIST" },
        { type: "SupportBooking", id: `bulk-${bulkOrderId}` },
      ],
    }),

    rescheduleIntent: builder.mutation<
      RescheduleIntentResponse,
      {
        booking_reference: string;
        new_date: string;
        new_time: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/bookings/reschedule_intent/",
        method: "PATCH",
        data: body,
      }),
    }),

    rescheduleSupportBooking: builder.mutation<
      { message?: string },
      {
        bookingId: string;
        booking_reference: string;
        new_date: string;
        new_time: string;
        total_cost?: number;
      }
    >({
      query: ({ bookingId: _bid, booking_reference, new_date, new_time, total_cost }) => ({
        url: "/api/v1/bookings/reschedule_booking/",
        method: "PATCH",
        data: {
          booking_reference,
          new_date,
          new_time,
          ...(total_cost != null ? { total_cost } : {}),
        },
      }),
      invalidatesTags: (_result, _error, { bookingId }) => [
        { type: "SupportBookings", id: "LIST" },
        { type: "SupportBooking", id: bookingId },
      ],
    }),

    rescheduleSupportBulkOrder: builder.mutation<
      { message?: string; error?: string },
      { bulkOrderId: string; new_date: string; new_time: string }
    >({
      query: ({ bulkOrderId, new_date, new_time }) => ({
        url: "/api/v1/bookings/reschedule_bulk_order/",
        method: "PATCH",
        data: {
          bulk_order_id: bulkOrderId,
          new_date,
          new_time,
        },
      }),
      invalidatesTags: (_result, _error, { bulkOrderId }) => [
        { type: "SupportBookings", id: "LIST" },
        { type: "SupportBooking", id: `bulk-${bulkOrderId}` },
      ],
    }),

    getReassignmentCandidates: builder.query<ReassignmentCandidatesPayload, string>({
      query: (bookingId) => ({
        url: "/api/v1/bookings/get_reassignment_candidates/",
        method: "GET",
        params: { booking_id: bookingId },
      }),
      transformResponse: (response: { data?: ReassignmentCandidatesPayload }) => {
        const d = response?.data;
        if (!d) throw new Error("Missing reassignment candidates in response");
        return d;
      },
    }),

    getBulkReassignmentCandidates: builder.query<ReassignmentCandidatesPayload, string>({
      query: (bulkOrderId) => ({
        url: "/api/v1/bookings/get_bulk_reassignment_candidates/",
        method: "GET",
        params: { bulk_order_id: bulkOrderId },
      }),
      transformResponse: (response: { data?: ReassignmentCandidatesPayload }) => {
        const d = response?.data;
        if (!d) throw new Error("Missing bulk reassignment candidates in response");
        return d;
      },
    }),

    getReassignmentHistory: builder.query<ReassignmentAuditEntry[], string>({
      query: (bookingReference) => ({
        url: "/api/v1/bookings/get_reassignment_history/",
        method: "GET",
        params: { booking_reference: bookingReference },
      }),
      transformResponse: (response: { data?: { history?: ReassignmentAuditEntry[] } }) =>
        response?.data?.history ?? [],
    }),

    reassignSupportBooking: builder.mutation<ReassignmentResponse, ReassignBookingRequest>({
      query: ({ bookingId, ...rest }) => ({
        url: "/api/v1/bookings/reassign_booking/",
        method: "PATCH",
        data: { booking_id: bookingId, ...rest },
      }),
      invalidatesTags: (_result, _error, { bookingId }) => [
        { type: "SupportBookings", id: "LIST" },
        { type: "SupportBooking", id: bookingId },
      ],
    }),

    reassignSupportBulkOrder: builder.mutation<ReassignmentResponse, ReassignBulkOrderRequest>({
      query: ({ bulkOrderId, ...rest }) => ({
        url: "/api/v1/bookings/reassign_bulk_order/",
        method: "PATCH",
        data: { bulk_order_id: bulkOrderId, ...rest },
      }),
      invalidatesTags: (_result, _error, { bulkOrderId }) => [
        { type: "SupportBookings", id: "LIST" },
        { type: "SupportBooking", id: `bulk-${bulkOrderId}` },
      ],
    }),
  }),
});

export const {
  useGetSupportBookingsListQuery,
  useGetSupportBookingDetailQuery,
  useGetSupportBulkOrderDetailQuery,
  useLazyGetRescheduleSlotsQuery,
  useLazyGetBulkRescheduleSlotsQuery,
  useCancelSupportBookingMutation,
  useCancelSupportBulkOrderMutation,
  useRescheduleIntentMutation,
  useRescheduleSupportBookingMutation,
  useRescheduleSupportBulkOrderMutation,
  useLazyGetReassignmentCandidatesQuery,
  useLazyGetBulkReassignmentCandidatesQuery,
  useGetReassignmentHistoryQuery,
  useReassignSupportBookingMutation,
  useReassignSupportBulkOrderMutation,
} = bookingApi;
export default bookingApi;
