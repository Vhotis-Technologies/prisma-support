/** Winner (promo) vouchers: list, detail, create, deactivate. */
import { SUPPORT_API } from "../../lib/routes";
import type {
  CreateVoucherBody,
  UpdateVoucherBody,
  VoucherDetails,
  WinnerVoucherDetails,
} from "../../types/voucher";
import { getData, patchData, postData } from "./client";

function mapVoucher(row: Record<string, unknown>): WinnerVoucherDetails {
  return {
    kind: "winner",
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

export async function getVouchersList(): Promise<VoucherDetails[]> {
  const response = await getData<{ data?: { vouchers?: Record<string, unknown>[] } }>(
    SUPPORT_API.vouchersList,
  );
  return (response.data?.vouchers ?? []).map(mapVoucher);
}

export async function getVoucherDetail(voucherId: string): Promise<VoucherDetails> {
  const response = await getData<{ data?: { voucher?: Record<string, unknown> } }>(
    SUPPORT_API.voucherDetail,
    { params: { voucher_id: voucherId } },
  );
  const voucher = response.data?.voucher;
  if (!voucher) throw new Error("Missing voucher in response");
  return mapVoucher(voucher);
}

export async function createVoucher(body: CreateVoucherBody): Promise<VoucherDetails> {
  const payload: Record<string, unknown> = {
    code: body.code,
    assigned_email: body.assigned_email,
    credit_amount: body.credit_amount,
    is_active: body.is_active,
  };
  if (body.valid_from) payload.valid_from = body.valid_from;
  if (body.expires_at) payload.expires_at = body.expires_at;
  const response = await postData<{ data?: { voucher?: Record<string, unknown> } }>(
    SUPPORT_API.createVoucher,
    payload,
  );
  const voucher = response.data?.voucher;
  if (!voucher) throw new Error("Missing voucher in response");
  return mapVoucher(voucher);
}

export async function updateVoucher(body: UpdateVoucherBody): Promise<VoucherDetails> {
  const data: Record<string, unknown> = { voucher_id: body.voucherId };
  if (typeof body.is_active === "boolean") data.is_active = body.is_active;
  if (body.valid_from !== undefined) data.valid_from = body.valid_from;
  if (body.expires_at !== undefined) data.expires_at = body.expires_at;
  const response = await patchData<{ data?: { voucher?: Record<string, unknown> } }>(
    SUPPORT_API.updateVoucher,
    data,
  );
  const voucher = response.data?.voucher;
  if (!voucher) throw new Error("Missing voucher in response");
  return mapVoucher(voucher);
}
