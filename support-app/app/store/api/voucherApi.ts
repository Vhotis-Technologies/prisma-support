import { createApi } from "@reduxjs/toolkit/query/react";
import type { VoucherDetails } from "@/app/interfaces/VoucherInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 120;

export type CreateVoucherBody = {
  code: string;
  assigned_email: string;
  credit_amount: string;
  valid_from?: string | null;
  expires_at?: string | null;
  is_active: boolean;
};

export type UpdateVoucherBody = {
  voucherId: string;
  is_active?: boolean;
  valid_from?: string | null;
  expires_at?: string | null;
};

function mapVoucher(row: Record<string, unknown>): VoucherDetails {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    assignedEmail: String(row.assignedEmail ?? ""),
    creditAmount: String(row.creditAmount ?? "0"),
    validFrom: (row.validFrom as string | null) ?? null,
    expiresAt: (row.expiresAt as string | null) ?? null,
    isActive: Boolean(row.isActive),
    redeemedAt: (row.redeemedAt as string | null) ?? null,
    assignedUserLabel: (row.assignedUserLabel as string | null) ?? null,
    consumedBookingRef: (row.consumedBookingRef as string | null) ?? null,
    createdAt: String(row.createdAt ?? ""),
  };
}

const voucherApi = createApi({
  reducerPath: "voucherApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["SupportVouchers", "SupportVoucher"],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    getVouchersList: builder.query<VoucherDetails[], void>({
      query: () => ({
        url: "/api/v1/vouchers/list_vouchers/",
        method: "GET",
      }),
      transformResponse: (response: {
        data?: { vouchers?: Record<string, unknown>[] };
      }): VoucherDetails[] => {
        const rows = response.data?.vouchers ?? [];
        return rows.map((r) => mapVoucher(r));
      },
      providesTags: [{ type: "SupportVouchers", id: "LIST" }],
    }),

    getVoucherDetail: builder.query<VoucherDetails, string>({
      query: (voucherId) => ({
        url: "/api/v1/vouchers/get_voucher_detail/",
        method: "GET",
        params: { voucher_id: voucherId },
      }),
      transformResponse: (response: {
        data?: { voucher?: Record<string, unknown> };
      }): VoucherDetails => {
        const v = response.data?.voucher;
        if (!v) throw new Error("Missing voucher in response");
        return mapVoucher(v);
      },
      providesTags: (_r, _e, id) => [{ type: "SupportVoucher", id }],
    }),

    createVoucher: builder.mutation<VoucherDetails, CreateVoucherBody>({
      query: (body) => {
        const payload: Record<string, unknown> = {
          code: body.code,
          assigned_email: body.assigned_email,
          credit_amount: body.credit_amount,
          is_active: body.is_active,
        };
        if (body.valid_from) payload.valid_from = body.valid_from;
        if (body.expires_at) payload.expires_at = body.expires_at;
        return {
          url: "/api/v1/vouchers/create_voucher/",
          method: "POST",
          data: payload,
        };
      },
      transformResponse: (response: {
        data?: { voucher?: Record<string, unknown> };
      }): VoucherDetails => {
        const v = response.data?.voucher;
        if (!v) throw new Error("Missing voucher in response");
        return mapVoucher(v);
      },
      invalidatesTags: [
        { type: "SupportVouchers", id: "LIST" },
      ],
    }),

    updateVoucher: builder.mutation<VoucherDetails, UpdateVoucherBody>({
      query: ({ voucherId, is_active, valid_from, expires_at }) => {
        const data: Record<string, unknown> = { voucher_id: voucherId };
        if (typeof is_active === "boolean") data.is_active = is_active;
        if (valid_from !== undefined) data.valid_from = valid_from;
        if (expires_at !== undefined) data.expires_at = expires_at;
        return {
          url: "/api/v1/vouchers/update_voucher/",
          method: "PATCH",
          data,
        };
      },
      transformResponse: (response: {
        data?: { voucher?: Record<string, unknown> };
      }): VoucherDetails => {
        const v = response.data?.voucher;
        if (!v) throw new Error("Missing voucher in response");
        return mapVoucher(v);
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "SupportVouchers", id: "LIST" },
        { type: "SupportVoucher", id: arg.voucherId },
      ],
    }),
  }),
});

export const {
  useGetVouchersListQuery,
  useGetVoucherDetailQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
} = voucherApi;
export default voucherApi;
