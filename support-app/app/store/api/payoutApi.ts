import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  CrewPayoutQueueItem,
  CrewPayoutQueueResponse,
  MarkCrewPayoutPaidArg,
  MarkPartnerPayoutPaidArg,
  PartnerPayoutQueueItem,
  PartnerPayoutQueueResponse,
} from "@/app/interfaces/PayoutInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 120;

const payoutApi = createApi({
  reducerPath: "payoutApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["PartnerPayoutQueue", "CrewPayoutQueue"],
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
      providesTags: [{ type: "CrewPayoutQueue", id: "LIST" }],
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
      invalidatesTags: [{ type: "PartnerPayoutQueue", id: "LIST" }],
    }),

    markCrewPayoutPaid: builder.mutation<{ message?: string }, MarkCrewPayoutPaidArg>({
      query: (body) => ({
        url: "/api/v1/payouts/mark_crew_payout_paid/",
        method: "POST",
        data: body,
      }),
      invalidatesTags: [{ type: "CrewPayoutQueue", id: "LIST" }],
    }),
  }),
});

export const {
  useGetPartnerPayoutQueueQuery,
  useGetCrewPayoutQueueQuery,
  useMarkPartnerPayoutPaidMutation,
  useMarkCrewPayoutPaidMutation,
} = payoutApi;

export default payoutApi;
