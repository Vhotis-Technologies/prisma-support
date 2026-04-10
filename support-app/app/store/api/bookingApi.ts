import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  BookingDetails,
  BulkOrderDetailResponse,
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
} = bookingApi;
export default bookingApi;
