/**
 * Display helpers for Ireland-facing copy (en-IE, EUR).
 *
 * `bookingPath` / `customerPath` / `vehiclePath` / `ticketPath` / `activityPath` /
 * `voucherPath` / `payoutPath` / `accountingMonthPath` must stay in sync with `App.tsx` routes.
 *
 * @module lib/format
 */
import type { AccountingMonthSummary } from "../types/accounting";
import type { ActivityItem, ActivityType } from "../types/activity";
import type { BookingAddress, GuestAccessSnapshot, SupportBookingListRow } from "../types/booking";
import type {
  CustomerAddress,
  FleetSubscription,
  SupportCustomerListItem,
} from "../types/customer";
import type { PayoutTabKind } from "../types/payout";
import type { SupportStaffRole, SupportUserPayload } from "../types/user";
import type { VoucherDetails, VoucherListStatus } from "../types/voucher";

export function supportFullName(user: SupportUserPayload | null | undefined): string {
  if (!user) return "Account";
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function supportInitial(user: SupportUserPayload | null | undefined): string {
  return supportFullName(user).charAt(0).toUpperCase() || "S";
}

export function supportRoleLabel(role: SupportStaffRole | undefined): string {
  if (role === "admin") return "Admin";
  return "Support";
}

export function formatSupportGender(code: string | null | undefined): string {
  if (!code) return "—";
  const map: Record<string, string> = {
    male: "Male",
    female: "Female",
    other: "Other",
  };
  return map[code] ?? code;
}

/** Date of birth from GET `/me/` (`YYYY-MM-DD` or ISO). Empty → em dash. */
export function formatSupportDob(isoDate: string | null | undefined): string {
  if (!isoDate?.trim()) return "—";
  const parsed = Date.parse(isoDate);
  if (Number.isNaN(parsed)) return isoDate;
  return new Date(parsed).toLocaleDateString("en-IE", { dateStyle: "medium" });
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatMetricValue(label: string, value: number): string {
  if (label.trim().toLowerCase() === "revenue") {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return value.toLocaleString("en-IE");
}

export function formatTimestamp(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ticketPillClass(status: string): string {
  if (status === "resolved") return "pill pill-ok";
  if (status === "closed") return "pill pill-muted";
  if (status === "cancelled") return "pill pill-error";
  return "pill pill-pending";
}

export function ticketPath(ticketId: string): string {
  return `/tickets/${ticketId}`;
}

export function voucherPath(voucher: VoucherDetails): string {
  return `/vouchers/${voucher.kind}/${voucher.id}`;
}

export function payoutPath(kind: PayoutTabKind, payoutId: string): string {
  return `/payouts/${kind}/${payoutId}`;
}

export function crewUnpaidPath(crewMemberId: string): string {
  return `/payouts/unpaid/${crewMemberId}`;
}

export function accountingMonthPath(year: number, month: number): string {
  return `/accounting/${year}/${month}`;
}

export function monthHeading(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-IE", {
    month: "long",
    year: "numeric",
  });
}

export function payoutPillClass(status: string): string {
  if (status === "paid" || status === "completed") return "pill pill-ok";
  if (status === "processing") return "pill pill-pending";
  if (status === "failed" || status === "cancelled") return "pill pill-error";
  return "pill pill-pending";
}

export function payoutStatusLabel(status: string): string {
  if (status === "completed") return "Paid";
  return formatStatus(status);
}

const ACCOUNTING_TX_LABELS: Record<string, string> = {
  payment: "Payment",
  refund: "Refund",
  vin_lookup: "Legacy lookup",
  tip: "Tip",
  fleet_subscription: "Fleet subscription",
  b2c_subscription: "B2C subscription",
  reschedule_fee: "Reschedule fee",
};

export function accountingTxnLabel(type: string): string {
  return ACCOUNTING_TX_LABELS[type] ?? formatStatus(type);
}

export function accountingTxnCount(summary: AccountingMonthSummary): number {
  let count = 0;
  for (const row of Object.values(summary.by_transaction_type)) {
    count += row.count;
  }
  return count;
}

export function accountingCurrencyLine(summary: AccountingMonthSummary): string {
  const entries = Object.entries(summary.currency_totals);
  if (entries.length === 0) return "—";
  return entries.map(([currency, row]) => `${currency} ${row.grand_total}`).join(" · ");
}

export function voucherCodeDisplay(voucher: VoucherDetails): string {
  if (voucher.kind === "gift" && !voucher.isPaid) return "Awaiting payment";
  return voucher.code || "—";
}

export function voucherStatusLabel(status: VoucherListStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "redeemed":
      return "Redeemed";
    case "expired":
      return "Expired";
    case "inactive":
      return "Inactive";
    case "pending_payment":
      return "Awaiting payment";
    default:
      return formatStatus(status);
  }
}

export function voucherPillClass(status: VoucherListStatus): string {
  if (status === "active") return "pill pill-ok";
  if (status === "redeemed") return "pill pill-pending";
  if (status === "expired") return "pill pill-error";
  if (status === "inactive") return "pill pill-muted";
  return "pill pill-pending";
}

const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  booking: "Booking",
  customer: "Customer",
  fleet: "Fleet",
  partner: "Partner",
  detailer: "Detailer",
  subscription: "Subscription",
  branch: "Branch",
  vehicle: "Vehicle",
  fleet_vehicle: "Fleet",
  transfer: "Transfer",
  payout: "Partner",
};

export function activityTypeLabel(type: ActivityType): string {
  return ACTIVITY_TYPE_LABELS[type] ?? formatStatus(type);
}

/**
 * Deep-link for an activity row. `entity_id` semantics match support-app:
 * vehicle/transfer ids are the B2C owner; branch/fleet_vehicle ids are the fleet.
 * Detailer links to crew (web-only; the app skipped that type).
 */
export function activityPath(activity: ActivityItem): string | null {
  const id = activity.entity_id;
  if (!id) return null;
  switch (activity.activity_type) {
    case "booking":
      return `/bookings/${id}`;
    case "customer":
    case "vehicle":
    case "transfer":
      return `/customers/b2c/${id}`;
    case "fleet":
    case "subscription":
    case "branch":
    case "fleet_vehicle":
      return `/customers/fleets/${id}`;
    case "partner":
    case "payout":
      return `/customers/partners/${id}`;
    case "detailer":
      return `/crew/${id}`;
    default:
      return null;
  }
}

/** Relative label; pass `nowMs` from a fetch/poll callback (not `Date.now()` during render). */
export function formatRelativeTime(iso: string, nowMs: number): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed) || !nowMs) return formatTimestamp(iso);
  const mins = Math.floor((nowMs - parsed) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const parsedDate = new Date(parsed);
  const sameYear = parsedDate.getFullYear() === new Date(nowMs).getFullYear();
  return parsedDate.toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function bookingPillClass(status: string): string {
  if (status === "confirmed" || status === "completed") return "pill pill-ok";
  if (status === "cancelled") return "pill pill-error";
  return "pill pill-pending";
}

export function guestPillClass(): string {
  return "pill pill-pending";
}

export function guestAccessLabel(access: GuestAccessSnapshot | null | undefined): string {
  if (!access) return "No link issued";
  switch (access.status) {
    case "active":
      return access.expires_at
        ? `Active until ${formatTimestamp(access.expires_at)}`
        : "Active";
    case "expired":
      return "Expired";
    case "revoked":
      return "Revoked";
    default:
      return "No link issued";
  }
}

export function b2cCustomerPath(customerId: string): string {
  return `/customers/b2c/${customerId}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatVoucherCredit(amount: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount || "—";
  return formatCurrency(value);
}

export function paymentLabel(raw: string | undefined | null): string {
  if (!raw) return "—";
  switch (raw) {
    case "invoice later":
    case "invoice_later":
      return "Invoice pending";
    case "paid":
      return "Paid";
    case "unpaid":
      return "Unpaid";
    case "partial":
      return "Partial";
    case "refunded":
      return "Refunded";
    case "cancelled":
      return "Cancelled";
    default:
      return formatStatus(raw);
  }
}

export function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || "?").toUpperCase();
}

export function formatAddressLine(
  address: BookingAddress | CustomerAddress | null | undefined,
): string {
  if (!address) return "—";
  return [address.address, address.city, address.postcode, address.country]
    .filter(Boolean)
    .join(", ");
}

export function mapsUrl(address: BookingAddress): string {
  return `https://www.google.com/maps/search/?api=1&query=${address.latitude},${address.longitude}`;
}

/** List rows are mixed: bulk orders must not hit `/bookings/:bookingId`. */
export function bookingPath(row: SupportBookingListRow): string {
  return row.kind === "bulk_order"
    ? `/bookings/bulk/${row.bulk_order_id}`
    : `/bookings/${row.id}`;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "N/A";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return "N/A";
  return new Date(parsed).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return "N/A";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleDateString("en-IE", { dateStyle: "medium" });
}

export function subscriptionLabel(sub: FleetSubscription | null | undefined): string {
  if (!sub?.subtype || sub.subtype === "No plan") return "No subscription";
  if (sub.status === "terminated") return "Terminated";
  if (sub.status === "expired") return "Expired";
  if (sub.status === "pending") return "Pending payment";
  if (sub.status === "past_due") return "Past due";
  if (sub.status === "trialing" || sub.is_trial) return "Trial active";
  return "Active";
}

export function subscriptionPillClass(sub: FleetSubscription | null | undefined): string {
  if (!sub?.subtype || sub.subtype === "No plan") return "pill pill-muted";
  if (sub.status === "terminated" || sub.status === "expired") return "pill pill-error";
  if (sub.status === "pending" || sub.status === "past_due" || sub.status === "trialing" || sub.is_trial) {
    return "pill pill-pending";
  }
  return "pill pill-ok";
}

export function customerPath(item: SupportCustomerListItem): string {
  if (item.type === "b2c") return `/customers/b2c/${item.id}`;
  if (item.type === "fleet") return `/customers/fleets/${item.id}`;
  return `/customers/partners/${item.id}`;
}

/** Optional owner ids so the vehicle page can remove/transfer in the right context. */
export function vehiclePath(
  vehicleId: string,
  ctx?: { userId?: string; fleetId?: string; partnerId?: string },
): string {
  const params = new URLSearchParams();
  if (ctx?.userId) params.set("userId", ctx.userId);
  if (ctx?.fleetId) params.set("fleetId", ctx.fleetId);
  if (ctx?.partnerId) params.set("partnerId", ctx.partnerId);
  const query = params.toString();
  return query ? `/customers/vehicles/${vehicleId}?${query}` : `/customers/vehicles/${vehicleId}`;
}

export function tierPillClass(tier: string | null | undefined): string {
  const key = (tier ?? "").toLowerCase();
  if (key === "bronze") return "tier-pill tier-pill--bronze";
  if (key === "silver") return "tier-pill tier-pill--silver";
  if (key === "gold") return "tier-pill tier-pill--gold";
  if (key === "platinum") return "tier-pill tier-pill--platinum";
  return "pill pill-pending";
}

