/**
 * Support UI types for winner-style vouchers (mirrors client WinnerVoucher fields for display).
 */
export type VoucherListStatus = "active" | "redeemed" | "expired" | "inactive";

export interface VoucherListItem {
  id: string;
  code: string;
  assignedEmail: string;
  creditAmount: string;
  validFrom: string | null;
  expiresAt: string | null;
  isActive: boolean;
  redeemedAt: string | null;
  assignedUserLabel: string | null;
  consumedBookingRef: string | null;
  createdAt: string;
}

export interface VoucherDetails extends VoucherListItem {}

export function getVoucherDisplayStatus(v: VoucherListItem): VoucherListStatus {
  if (!v.isActive) return "inactive";
  if (v.redeemedAt) return "redeemed";
  const now = Date.now();
  if (v.expiresAt && new Date(v.expiresAt).getTime() < now) return "expired";
  return "active";
}
