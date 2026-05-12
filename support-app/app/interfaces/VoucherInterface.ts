/**
 * Support voucher types: marketing winner vouchers and customer-paid gift vouchers.
 */

export type VoucherKind = "winner" | "gift";

export type VoucherListStatus =
  | "active"
  | "redeemed"
  | "expired"
  | "inactive"
  | "pending_payment";

export interface WinnerVoucherDetails {
  kind: "winner";
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

export interface GiftVoucherDetails {
  kind: "gift";
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
  validityDays: number;
  purchaseCurrency: string;
  isPaid: boolean;
  emailSentAt: string | null;
  purchaserEmail: string | null;
  purchaserLabel: string | null;
  paymentAmount: string | null;
  paymentCurrency: string | null;
  paymentLast4: string | null;
  paymentCardBrand: string | null;
  stripePaymentIntentId: string | null;
}

export type VoucherDetails = WinnerVoucherDetails | GiftVoucherDetails;

/** Legacy name — same union as lists / detail rows. */
export type VoucherListItem = VoucherDetails;

export function getVoucherDisplayStatus(v: VoucherDetails): VoucherListStatus {
  if ("isPaid" in v && !v.isPaid) return "pending_payment";
  if (!v.isActive) return "inactive";
  if (v.redeemedAt) return "redeemed";
  const now = Date.now();
  if (v.expiresAt && new Date(v.expiresAt).getTime() < now) return "expired";
  return "active";
}
