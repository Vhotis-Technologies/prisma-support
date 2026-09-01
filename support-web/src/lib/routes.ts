/**
 * Support API path inventory.
 *
 * Frozen from `support-app/app/store/api/*` against `support/server` `main/urls.py`.
 * Web UI must call these paths only — do not invent new actions.
 */
export const SUPPORT_API = {
  health: "/health",

  login: "/api/v1/authentication/login/",
  refresh: "/api/v1/authentication/refresh/",
  register: "/api/v1/onboard/create_new_account/",
  me: "/api/v1/me/",
  passwordReset: "/api/v1/auth/password-reset/",
  validateResetToken: "/api/v1/auth/validate-reset-token/",
  resetPassword: "/api/v1/auth/reset-password/",

  dashboardData: "/api/v1/dashboard/get_dashboard_data/",

  bookingsList: "/api/v1/bookings/get_bookings_list/",
  bookingDetail: "/api/v1/bookings/get_booking_detail/",
  bulkOrderDetail: "/api/v1/bookings/get_bulk_order_detail/",
  rescheduleSlots: "/api/v1/bookings/get_reschedule_slots/",
  bulkRescheduleSlots: "/api/v1/bookings/get_bulk_reschedule_slots/",
  cancelBooking: "/api/v1/bookings/cancel_booking/",
  cancelBulkOrder: "/api/v1/bookings/cancel_bulk_order/",
  rescheduleIntent: "/api/v1/bookings/reschedule_intent/",
  rescheduleBooking: "/api/v1/bookings/reschedule_booking/",
  rescheduleBulkOrder: "/api/v1/bookings/reschedule_bulk_order/",
  reassignmentCandidates: "/api/v1/bookings/get_reassignment_candidates/",
  bulkReassignmentCandidates: "/api/v1/bookings/get_bulk_reassignment_candidates/",
  reassignmentHistory: "/api/v1/bookings/get_reassignment_history/",
  reassignBooking: "/api/v1/bookings/reassign_booking/",
  reassignBulkOrder: "/api/v1/bookings/reassign_bulk_order/",
  resendGuestResultsEmail: "/api/v1/bookings/resend_guest_results_email/",

  customersList: "/api/v1/customers/get_customers_list/",
  b2cDetail: "/api/v1/customers/get_b2c_detail/",
  fleetDetail: "/api/v1/customers/get_fleet_detail/",
  partnerDetail: "/api/v1/customers/get_partner_detail/",
  fleetBranchDetail: "/api/v1/customers/get_fleet_branch_detail/",
  partnerReferredUsers: "/api/v1/customers/get_partner_referred_users/",
  vehicleDetail: "/api/v1/customers/get_vehicle_detail/",
  terminateFleetSubscription: "/api/v1/customers/terminate_fleet_subscription/",
  renewFleetSubscription: "/api/v1/customers/renew_fleet_subscription/",
  terminateB2cSubscription: "/api/v1/customers/terminate_b2c_subscription/",
  renewB2cSubscription: "/api/v1/customers/renew_b2c_subscription/",
  removeVehicle: "/api/v1/customers/remove_vehicle/",
  removeBranch: "/api/v1/customers/remove_branch/",
  vehicleTransfer: "/api/v1/customers/vehicle_transfer/",
  deleteUserAccount: "/api/v1/customers/delete_user_account/",

  crewList: "/api/v1/crew/get_crew_list/",
  crewDetail: "/api/v1/crew/get_crew_detail/",
  updateCrew: "/api/v1/crew/update_crew/",

  ticketsList: "/api/v1/tickets/list_tickets/",
  ticketDetail: "/api/v1/tickets/get_ticket_detail/",
  updateTicket: "/api/v1/tickets/update_ticket/",

  activityFeed: "/api/v1/activities/get_activity_feed/",

  vouchersList: "/api/v1/vouchers/list_vouchers/",
  voucherDetail: "/api/v1/vouchers/get_voucher_detail/",
  createVoucher: "/api/v1/vouchers/create_voucher/",
  updateVoucher: "/api/v1/vouchers/update_voucher/",

  giftVouchersList: "/api/v1/gift-vouchers/list_gift_vouchers/",
  giftVoucherDetail: "/api/v1/gift-vouchers/get_gift_voucher_detail/",
  updateGiftVoucher: "/api/v1/gift-vouchers/update_gift_voucher/",

  accountingSummaries: "/api/v1/accounting/get_monthly_summaries/",
  accountingMonthDetail: "/api/v1/accounting/get_month_detail/",

  partnerPayoutQueue: "/api/v1/payouts/get_payout_queue/",
  crewPayoutQueue: "/api/v1/payouts/get_crew_payout_queue/",
  crewPayoutDetail: "/api/v1/payouts/get_crew_payout_detail/",
  partnerBalance: "/api/v1/payouts/get_partner_balance/",
  crewUnpaidEarnings: "/api/v1/payouts/get_crew_unpaid_earnings/",
  crewUnpaidEarningsDetail: "/api/v1/payouts/get_crew_unpaid_earnings_detail/",
  markPartnerPayoutPaid: "/api/v1/payouts/mark_partner_payout_paid/",
  markCrewPayoutPaid: "/api/v1/payouts/mark_crew_payout_paid/",
  createCrewPayout: "/api/v1/payouts/create_crew_payout/",
  recordCrewPaymentMade: "/api/v1/payouts/record_crew_payment_made/",

  saveNotificationToken: "/api/v1/notifications/save_notification_token/",
} as const;

export type SupportApiPath = (typeof SUPPORT_API)[keyof typeof SUPPORT_API];

/** Paths that must not send a Bearer token (wired in Phase 2 interceptors). */
export const PUBLIC_PATH_PREFIXES: SupportApiPath[] = [
  SUPPORT_API.health,
  SUPPORT_API.login,
  SUPPORT_API.refresh,
  SUPPORT_API.register,
  SUPPORT_API.passwordReset,
  SUPPORT_API.validateResetToken,
  SUPPORT_API.resetPassword,
];
