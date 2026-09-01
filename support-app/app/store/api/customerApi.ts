import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  B2CDetails,
  B2CListItem,
  CustomerSegment,
  FleetBranchDetails,
  FleetDetails,
  FleetListItem,
  PartnerDetails,
  PartnerListItem,
  RemoveSupportBranchArg,
  RemoveSupportBranchResponse,
  RemoveSupportVehicleArg,
  RemoveSupportVehicleResponse,
  RenewB2cSubscriptionArg,
  RenewB2cSubscriptionResponse,
  RenewFleetSubscriptionArg,
  RenewFleetSubscriptionResponse,
  ReferredUserDetails,
  SupportB2cDetailResponse,
  SupportCustomerListItem,
  SupportCustomersListResponse,
  SupportFleetBranchDetailResponse,
  SupportFleetBranchQueryArg,
  SupportFleetDetailResponse,
  SupportPartnerDetailResponse,
  SupportPartnerReferredUsersResponse,
  TerminateB2cSubscriptionArg,
  TerminateB2cSubscriptionResponse,
  TerminateFleetSubscriptionArg,
  TerminateFleetSubscriptionResponse,
} from "@/app/interfaces/CustomerInterface";
import type {
  SupportVehicleDetailResponse,
  SupportVehicleStats,
  SupportVehicleTransferResponse,
} from "@/app/interfaces/SupportVehicleInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 300;

function parseListRows(
  rows: unknown[],
  segment: CustomerSegment
): SupportCustomerListItem[] {
  const out: SupportCustomerListItem[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const t = o.type;
    if (segment === "b2c" && t === "b2c") {
      out.push(row as B2CListItem);
    } else if (segment === "guests" && t === "b2c") {
      out.push(row as B2CListItem);
    } else if (segment === "fleets" && t === "fleet") {
      out.push(row as FleetListItem);
    } else if (segment === "partners" && t === "partner") {
      out.push(row as PartnerListItem);
    }
  }
  return out;
}

const customerApi = createApi({
  reducerPath: "customerApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "SupportCustomers",
    "SupportCustomer",
    "SupportFleetBranch",
    "SupportPartnerReferrals",
    "SupportVehicle",
  ],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    getSupportCustomersList: builder.query<SupportCustomerListItem[], CustomerSegment>({
      query: (segment) => ({
        url: "/api/v1/customers/get_customers_list/",
        method: "GET",
        params: { segment },
      }),
      transformResponse: (response: unknown, _meta, segment) => {
        const customers = (response as SupportCustomersListResponse)?.data?.customers;
        const rows = Array.isArray(customers) ? customers : [];
        return parseListRows(rows, segment);
      },
      providesTags: (_result, _err, segment) => [{ type: "SupportCustomers", id: segment }],
    }),

    getSupportB2cCustomerDetail: builder.query<B2CDetails, string>({
      query: (customerId) => ({
        url: "/api/v1/customers/get_b2c_detail/",
        method: "GET",
        params: { customer_id: customerId },
      }),
      transformResponse: (response: SupportB2cDetailResponse) => {
        const c = response.data?.customer;
        if (!c) throw new Error("Missing customer in response");
        return c;
      },
      providesTags: (_result, _err, customerId) => [
        { type: "SupportCustomer", id: `b2c-${customerId}` },
      ],
    }),

    getSupportFleetCustomerDetail: builder.query<FleetDetails, string>({
      query: (customerId) => ({
        url: "/api/v1/customers/get_fleet_detail/",
        method: "GET",
        params: { customer_id: customerId },
      }),
      transformResponse: (response: SupportFleetDetailResponse) => {
        const c = response.data?.customer;
        if (!c) throw new Error("Missing customer in response");
        return c;
      },
      providesTags: (_result, _err, customerId) => [
        { type: "SupportCustomer", id: `fleets-${customerId}` },
      ],
    }),

    getSupportPartnerCustomerDetail: builder.query<PartnerDetails, string>({
      query: (customerId) => ({
        url: "/api/v1/customers/get_partner_detail/",
        method: "GET",
        params: { customer_id: customerId },
      }),
      transformResponse: (response: SupportPartnerDetailResponse) => {
        const c = response.data?.customer;
        if (!c) throw new Error("Missing customer in response");
        return c;
      },
      providesTags: (_result, _err, customerId) => [
        { type: "SupportCustomer", id: `partners-${customerId}` },
      ],
    }),

    getSupportFleetBranchDetail: builder.query<FleetBranchDetails, SupportFleetBranchQueryArg>({
      query: ({ fleetId, branchId }) => ({
        url: "/api/v1/customers/get_fleet_branch_detail/",
        method: "GET",
        params: { fleet_id: fleetId, branch_id: branchId },
      }),
      transformResponse: (response: SupportFleetBranchDetailResponse) => {
        const b = response.data?.branch;
        if (!b) throw new Error("Missing branch in response");
        return b;
      },
      providesTags: (_result, _err, { fleetId, branchId }) => [
        { type: "SupportFleetBranch", id: `${fleetId}-${branchId}` },
        { type: "SupportCustomer", id: `fleets-${fleetId}` },
      ],
    }),

    getSupportPartnerReferredUsers: builder.query<ReferredUserDetails[], string>({
      query: (partnerId) => ({
        url: "/api/v1/customers/get_partner_referred_users/",
        method: "GET",
        params: { partner_id: partnerId },
      }),
      transformResponse: (response: SupportPartnerReferredUsersResponse) =>
        response.data?.users ?? [],
      providesTags: (_result, _err, partnerId) => [
        { type: "SupportPartnerReferrals", id: partnerId },
        { type: "SupportCustomer", id: `partners-${partnerId}` },
      ],
    }),

    getSupportVehicleDetail: builder.query<SupportVehicleStats, string>({
      query: (vehicleId) => ({
        url: "/api/v1/customers/get_vehicle_detail/",
        method: "GET",
        params: { vehicle_id: vehicleId },
      }),
      transformResponse: (response: SupportVehicleDetailResponse): SupportVehicleStats => {
        const raw = response.data;
        if (!raw?.vehicle) {
          throw new Error((response as { error?: string }).error || "Missing vehicle in response");
        }
        const v = raw.vehicle;
        return {
          ...raw,
          vehicle: {
            ...v,
            licence: v.licence || v.registration_number || "",
          },
        };
      },
      providesTags: (_result, _err, vehicleId) => [{ type: "SupportVehicle", id: vehicleId }],
    }),

    terminateFleetSubscription: builder.mutation<
      TerminateFleetSubscriptionResponse,
      TerminateFleetSubscriptionArg
    >({
      query: ({ fleetId, reason }) => ({
        url: "/api/v1/customers/terminate_fleet_subscription/",
        method: "PATCH",
        data: { fleet_id: fleetId, ...(reason != null ? { reason } : {}) },
      }),
      invalidatesTags: (_r, _e, { fleetId }) => [
        { type: "SupportCustomers", id: "fleets" },
        { type: "SupportCustomer", id: `fleets-${fleetId}` },
      ],
    }),

    renewFleetSubscription: builder.mutation<
      RenewFleetSubscriptionResponse,
      RenewFleetSubscriptionArg
    >({
      query: ({ fleetId }) => ({
        url: "/api/v1/customers/renew_fleet_subscription/",
        method: "PATCH",
        data: { fleet_id: fleetId },
      }),
      invalidatesTags: (_r, _e, { fleetId }) => [
        { type: "SupportCustomers", id: "fleets" },
        { type: "SupportCustomer", id: `fleets-${fleetId}` },
      ],
    }),

    terminateB2cSubscription: builder.mutation<
      TerminateB2cSubscriptionResponse,
      TerminateB2cSubscriptionArg
    >({
      query: ({ userId, reason }) => ({
        url: "/api/v1/customers/terminate_b2c_subscription/",
        method: "PATCH",
        data: { user_id: userId, ...(reason != null ? { reason } : {}) },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: "SupportCustomers", id: "b2c" },
        { type: "SupportCustomer", id: `b2c-${userId}` },
      ],
    }),

    renewB2cSubscription: builder.mutation<RenewB2cSubscriptionResponse, RenewB2cSubscriptionArg>({
      query: ({ userId }) => ({
        url: "/api/v1/customers/renew_b2c_subscription/",
        method: "PATCH",
        data: { user_id: userId },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: "SupportCustomers", id: "b2c" },
        { type: "SupportCustomer", id: `b2c-${userId}` },
      ],
    }),

    removeSupportVehicle: builder.mutation<RemoveSupportVehicleResponse, RemoveSupportVehicleArg>({
      query: ({ vehicleId, fleetId, userId }) => ({
        url: "/api/v1/customers/remove_vehicle/",
        method: "PATCH",
        data: {
          vehicle_id: vehicleId,
          ...(fleetId != null ? { fleet_id: fleetId } : {}),
          ...(userId != null ? { user_id: userId } : {}),
        },
      }),
      invalidatesTags: (_r, _e, arg) => {
        const tags: Array<
          | { type: "SupportCustomers"; id: CustomerSegment }
          | { type: "SupportCustomer"; id: string }
          | { type: "SupportVehicle"; id: string }
        > = [{ type: "SupportCustomers", id: "b2c" }, { type: "SupportCustomers", id: "fleets" }];
        if (arg.userId) {
          tags.push({ type: "SupportCustomer", id: `b2c-${arg.userId}` });
        }
        if (arg.fleetId) {
          tags.push({ type: "SupportCustomer", id: `fleets-${arg.fleetId}` });
        }
        if (arg.partnerId) {
          tags.push({ type: "SupportCustomer", id: `partners-${arg.partnerId}` });
        }
        tags.push({ type: "SupportVehicle", id: arg.vehicleId });
        return tags;
      },
    }),

    removeSupportBranch: builder.mutation<RemoveSupportBranchResponse, RemoveSupportBranchArg>({
      query: ({ fleetId, branchId }) => ({
        url: "/api/v1/customers/remove_branch/",
        method: "PATCH",
        data: { fleet_id: fleetId, branch_id: branchId },
      }),
      invalidatesTags: (_r, _e, { fleetId, branchId }) => [
        { type: "SupportCustomers", id: "fleets" },
        { type: "SupportCustomer", id: `fleets-${fleetId}` },
        { type: "SupportFleetBranch", id: `${fleetId}-${branchId}` },
      ],
    }),

    supportVehicleTransfer: builder.mutation<
      SupportVehicleTransferResponse,
      { vehicleId: string; transferId: string; action: "approve" | "reject" }
    >({
      query: ({ vehicleId, transferId, action }) => ({
        url: "/api/v1/customers/vehicle_transfer/",
        method: "PATCH",
        data: { vehicle_id: vehicleId, transfer_id: transferId, action },
      }),
      invalidatesTags: (_r, _e, { vehicleId }) => [
        { type: "SupportVehicle", id: vehicleId },
        { type: "SupportCustomers", id: "b2c" },
      ],
    }),

    deleteUserAccount: builder.mutation<
      { message?: string; user_id?: string; deleted_by?: string },
      { user_id: string; reason?: string }
    >({
      query: (body) => ({
        url: "/api/v1/customers/delete_user_account/",
        method: "POST",
        data: body,
      }),
      transformResponse: (response: { data?: { message?: string; user_id?: string; deleted_by?: string } }) =>
        response.data ?? {},
      invalidatesTags: (_r, _e, { user_id }) => [
        { type: "SupportCustomers", id: "b2c" },
        { type: "SupportCustomer", id: `b2c-${user_id}` },
      ],
    }),
  }),
});

export const {
  useGetSupportCustomersListQuery,
  useGetSupportB2cCustomerDetailQuery,
  useGetSupportFleetCustomerDetailQuery,
  useGetSupportPartnerCustomerDetailQuery,
  useGetSupportFleetBranchDetailQuery,
  useGetSupportPartnerReferredUsersQuery,
  useGetSupportVehicleDetailQuery,
  useTerminateFleetSubscriptionMutation,
  useRenewFleetSubscriptionMutation,
  useTerminateB2cSubscriptionMutation,
  useRenewB2cSubscriptionMutation,
  useRemoveSupportVehicleMutation,
  useRemoveSupportBranchMutation,
  useSupportVehicleTransferMutation,
  useDeleteUserAccountMutation,
} = customerApi;
export default customerApi;
