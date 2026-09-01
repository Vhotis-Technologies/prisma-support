export type VoucherKind = "winner" | "gift";

export type VoucherListStatus =
  | "active"
  | "redeemed"
  | "expired"
  | "inactive"
  | "pending_payment";

export type WinnerVoucherDetails = {
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
};

export type GiftVoucherDetails = {
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
};

export type VoucherDetails = WinnerVoucherDetails | GiftVoucherDetails;

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

export type UpdateGiftVoucherBody = UpdateVoucherBody;

/** Pass `nowMs` from a fetch callback — do not call `Date.now()` during render. */
export function getVoucherDisplayStatus(
  v: VoucherDetails,
  nowMs: number,
): VoucherListStatus {
  if (v.kind === "gift" && !v.isPaid) return "pending_payment";
  if (!v.isActive) return "inactive";
  if (v.redeemedAt) return "redeemed";
  if (nowMs && v.expiresAt && Date.parse(v.expiresAt) < nowMs) return "expired";
  return "active";
}
