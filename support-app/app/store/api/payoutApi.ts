import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CreateCrewPayoutArg,
  CreateCrewPayoutResponse,
  RecordCrewPaymentMadeArg,
  RecordCrewPaymentMadeResponse,
  CrewPayoutDetailResponse,
  CrewPayoutQueueItem,
  CrewPayoutQueueResponse,
  CrewUnpaidDetail,
  CrewUnpaidDetailResponse,
  CrewUnpaidSummary,
  CrewUnpaidSummaryResponse,
  MarkCrewPayoutPaidArg,
  MarkPartnerPayoutPaidArg,
  PartnerBalance,
  PartnerBalanceResponse,
  PartnerPayoutQueueItem,
  PartnerPayoutQueueResponse,
} from "@/app/interfaces/PayoutInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 120;

const payoutApi = createApi({
  reducerPath: "payoutApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "PartnerPayoutQueue",
    "CrewPayoutQueue",
    "CrewUnpaidEarnings",
    "PartnerBalance",
  ],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    getPartnerPayoutQueue: builder.query<PartnerPayoutQueueItem[], string | void>({
      query: (status) => ({
        url: "/api/v1/payouts/get_payout_queue/",
        method: "GET",
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: PartnerPayoutQueueResponse) =>
        response.data?.payout_requests ?? [],
      providesTags: [{ type: "PartnerPayoutQueue", id: "LIST" }],
    }),

    getCrewPayoutQueue: builder.query<CrewPayoutQueueItem[], string | void>({
      query: (status) => ({
        url: "/api/v1/payouts/get_crew_payout_queue/",
        method: "GET",
        params: status ? { status } : undefined,
      }),
      transformResponse: (response: CrewPayoutQueueResponse) =>
        response.data?.payout_requests ?? [],
      providesTags: (_result, _err, status) => [
        {
          type: "CrewPayoutQueue",
          id: status === "completed" ? "COMPLETED" : "LIST",
        },
      ],
    }),

    getCrewPayoutDetail: builder.query<CrewPayoutQueueItem | null, string>({
      query: (payoutId) => ({
        url: "/api/v1/payouts/get_crew_payout_detail/",
        method: "GET",
        params: { payout_id: payoutId },
      }),
      transformResponse: (response: CrewPayoutDetailResponse) =>
        response.data?.payout ?? null,
      providesTags: (_result, _err, id) => [{ type: "CrewPayoutQueue", id }],
    }),

    getPartnerBalance: builder.query<PartnerBalance | null, string>({
      query: (payoutRequestId) => ({
        url: "/api/v1/payouts/get_partner_balance/",
        method: "GET",
        params: { payout_request_id: payoutRequestId },
      }),
      transformResponse: (response: PartnerBalanceResponse) =>
        response.data ?? null,
      providesTags: (_result, _err, id) => [{ type: "PartnerBalance", id }],
    }),

    getCrewUnpaidEarnings: builder.query<CrewUnpaidSummary[], void>({
      query: () => ({
        url: "/api/v1/payouts/get_crew_unpaid_earnings/",
        method: "GET",
      }),
      transformResponse: (response: CrewUnpaidSummaryResponse) =>
        response.data?.crew_unpaid_earnings ?? [],
      providesTags: [{ type: "CrewUnpaidEarnings", id: "LIST" }],
    }),

    getCrewUnpaidEarningsDetail: builder.query<CrewUnpaidDetail | null, string>({
      query: (crewMemberId) => ({
        url: "/api/v1/payouts/get_crew_unpaid_earnings_detail/",
        method: "GET",
        params: { crew_member_id: crewMemberId },
      }),
      transformResponse: (response: CrewUnpaidDetailResponse) =>
        response.data ?? null,
      providesTags: (_result, _err, id) => [
        { type: "CrewUnpaidEarnings", id: id ?? "DETAIL" },
      ],
    }),

    markPartnerPayoutPaid: builder.mutation<
      { message?: string },
      MarkPartnerPayoutPaidArg
    >({
      query: (body) => ({
        url: "/api/v1/payouts/mark_partner_payout_paid/",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "PartnerPayoutQueue", id: "LIST" },
        { type: "PartnerBalance", id: arg.payout_request_id },
      ],
    }),

    markCrewPayoutPaid: builder.mutation<{ message?: string }, MarkCrewPayoutPaidArg>({
      query: (body) => ({
        url: "/api/v1/payouts/mark_crew_payout_paid/",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [
        { type: "CrewPayoutQueue", id: "LIST" },
        { type: "CrewPayoutQueue", id: "COMPLETED" },
        { type: "CrewUnpaidEarnings", id: "LIST" },
      ],
    }),

    createCrewPayout: builder.mutation<CreateCrewPayoutResponse, CreateCrewPayoutArg>({
      query: (body) => ({
        url: "/api/v1/payouts/create_crew_payout/",
        method: "POST",
        data: body,
      }),
      invalidatesTags: (_result, _err, arg) => [
        { type: "CrewPayoutQueue", id: "LIST" },
        { type: "CrewUnpaidEarnings", id: "LIST" },
        { type: "CrewUnpaidEarnings", id: arg.crew_member_id },
      ],
    }),

    recordCrewPaymentMade: builder.mutation<
      RecordCrewPaymentMadeResponse["data"],
      RecordCrewPaymentMadeArg
    >({
      query: (body) => ({
        url: "/api/v1/payouts/record_crew_payment_made/",
        method: "POST",
        data: body,
      }),
      transformResponse: (response: RecordCrewPaymentMadeResponse) =>
        response.data,
      invalidatesTags: (_result, _err, arg) => [
        { type: "CrewPayoutQueue", id: "LIST" },
        { type: "CrewPayoutQueue", id: "COMPLETED" },
        { type: "CrewUnpaidEarnings", id: "LIST" },
        { type: "CrewUnpaidEarnings", id: arg.crew_member_id },
      ],
    }),
  }),
});

export const {
  useGetPartnerPayoutQueueQuery,
  useGetCrewPayoutQueueQuery,
  useGetCrewPayoutDetailQuery,
  useGetPartnerBalanceQuery,
  useGetCrewUnpaidEarningsQuery,
  useGetCrewUnpaidEarningsDetailQuery,
  useMarkPartnerPayoutPaidMutation,
  useMarkCrewPayoutPaidMutation,
  useCreateCrewPayoutMutation,
  useRecordCrewPaymentMadeMutation,
} = payoutApi;

export default payoutApi;
