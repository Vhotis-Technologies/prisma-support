import { createApi } from "@reduxjs/toolkit/query/react";
import type { GiftVoucherDetails } from "@/app/interfaces/VoucherInterface";
import axiosBaseQuery from "../baseQuery";

const CACHE_SEC = 120;

export type UpdateGiftVoucherBody = {
  voucherId: string;
  is_active?: boolean;
  valid_from?: string | null;
  expires_at?: string | null;
};

function mapGiftVoucher(row: Record<string, unknown>): GiftVoucherDetails {
  return {
    kind: "gift",
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
    validityDays: Number(row.validityDays ?? 0),
    purchaseCurrency: String(row.purchaseCurrency ?? "eur"),
    isPaid: Boolean(row.isPaid),
    emailSentAt: (row.emailSentAt as string | null) ?? null,
    purchaserEmail: (row.purchaserEmail as string | null) ?? null,
    purchaserLabel: (row.purchaserLabel as string | null) ?? null,
    paymentAmount: (row.paymentAmount as string | null) ?? null,
    paymentCurrency: (row.paymentCurrency as string | null) ?? null,
    paymentLast4: (row.paymentLast4 as string | null) ?? null,
    paymentCardBrand: (row.paymentCardBrand as string | null) ?? null,
    stripePaymentIntentId: (row.stripePaymentIntentId as string | null) ?? null,
  };
}

const giftVoucherApi = createApi({
  reducerPath: "giftVoucherApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["SupportGiftVouchers", "SupportGiftVoucher"],
  refetchOnReconnect: true,
  keepUnusedDataFor: CACHE_SEC,
  endpoints: (builder) => ({
    getGiftVouchersList: builder.query<GiftVoucherDetails[], void>({
      query: () => ({
        url: "/api/v1/gift-vouchers/list_gift_vouchers/",
        method: "GET",
      }),
      transformResponse: (response: {
        data?: { gift_vouchers?: Record<string, unknown>[] };
      }): GiftVoucherDetails[] => {
        const rows = response.data?.gift_vouchers ?? [];
        return rows.map((r) => mapGiftVoucher(r));
      },
      providesTags: [{ type: "SupportGiftVouchers", id: "LIST" }],
    }),

    getGiftVoucherDetail: builder.query<GiftVoucherDetails, string>({
      query: (voucherId) => ({
        url: "/api/v1/gift-vouchers/get_gift_voucher_detail/",
        method: "GET",
        params: { gift_voucher_id: voucherId },
      }),
      transformResponse: (response: {
        data?: { gift_voucher?: Record<string, unknown> };
      }): GiftVoucherDetails => {
        const v = response.data?.gift_voucher;
        if (!v) throw new Error("Missing gift voucher in response");
        return mapGiftVoucher(v);
      },
      providesTags: (_r, _e, id) => [{ type: "SupportGiftVoucher", id }],
    }),

    updateGiftVoucher: builder.mutation<GiftVoucherDetails, UpdateGiftVoucherBody>({
      query: ({ voucherId, is_active, valid_from, expires_at }) => {
        const data: Record<string, unknown> = {
          gift_voucher_id: voucherId,
        };
        if (typeof is_active === "boolean") data.is_active = is_active;
        if (valid_from !== undefined) data.valid_from = valid_from;
        if (expires_at !== undefined) data.expires_at = expires_at;
        return {
          url: "/api/v1/gift-vouchers/update_gift_voucher/",
          method: "PATCH",
          data,
        };
      },
      transformResponse: (response: {
        data?: { gift_voucher?: Record<string, unknown> };
      }): GiftVoucherDetails => {
        const v = response.data?.gift_voucher;
        if (!v) throw new Error("Missing gift voucher in response");
        return mapGiftVoucher(v);
      },
      invalidatesTags: (_r, _e, arg) => [
        { type: "SupportGiftVouchers", id: "LIST" },
        { type: "SupportGiftVoucher", id: arg.voucherId },
      ],
    }),
  }),
});

export const {
  useGetGiftVouchersListQuery,
  useGetGiftVoucherDetailQuery,
  useUpdateGiftVoucherMutation,
} = giftVoucherApi;
export default giftVoucherApi;
