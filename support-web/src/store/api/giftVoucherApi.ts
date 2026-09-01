/** Customer-purchased gift vouchers: list, detail, deactivate. */
import { SUPPORT_API } from "../../lib/routes";
import type { GiftVoucherDetails, UpdateGiftVoucherBody } from "../../types/voucher";
import { getData, patchData } from "./client";

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

export async function getGiftVouchersList(): Promise<GiftVoucherDetails[]> {
  const response = await getData<{
    data?: { gift_vouchers?: Record<string, unknown>[] };
  }>(SUPPORT_API.giftVouchersList);
  return (response.data?.gift_vouchers ?? []).map(mapGiftVoucher);
}

export async function getGiftVoucherDetail(voucherId: string): Promise<GiftVoucherDetails> {
  const response = await getData<{ data?: { gift_voucher?: Record<string, unknown> } }>(
    SUPPORT_API.giftVoucherDetail,
    { params: { gift_voucher_id: voucherId } },
  );
  const voucher = response.data?.gift_voucher;
  if (!voucher) throw new Error("Missing gift voucher in response");
  return mapGiftVoucher(voucher);
}

export async function updateGiftVoucher(
  body: UpdateGiftVoucherBody,
): Promise<GiftVoucherDetails> {
  const data: Record<string, unknown> = { gift_voucher_id: body.voucherId };
  if (typeof body.is_active === "boolean") data.is_active = body.is_active;
  if (body.valid_from !== undefined) data.valid_from = body.valid_from;
  if (body.expires_at !== undefined) data.expires_at = body.expires_at;
  const response = await patchData<{ data?: { gift_voucher?: Record<string, unknown> } }>(
    SUPPORT_API.updateGiftVoucher,
    data,
  );
  const voucher = response.data?.gift_voucher;
  if (!voucher) throw new Error("Missing gift voucher in response");
  return mapGiftVoucher(voucher);
}
