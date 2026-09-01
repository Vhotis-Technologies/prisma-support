import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { GuestOnly, RequireAuth } from "./auth/guards";
import ConnectionCheckPage from "./pages/ConnectionCheckPage";
import B2cDetailPage from "./pages/B2cDetailPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import BookingsPage from "./pages/BookingsPage";
import BulkOrderDetailPage from "./pages/BulkOrderDetailPage";
import CrewDetailPage from "./pages/CrewDetailPage";
import CrewPage from "./pages/CrewPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import FleetBranchDetailPage from "./pages/FleetBranchDetailPage";
import FleetDetailPage from "./pages/FleetDetailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HelpPage from "./pages/HelpPage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import PartnerDetailPage from "./pages/PartnerDetailPage";
import PartnerReferredPage from "./pages/PartnerReferredPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import TicketsPage from "./pages/TicketsPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import ActivitiesPage from "./pages/ActivitiesPage";
import VoucherDetailPage from "./pages/VoucherDetailPage";
import VouchersPage from "./pages/VouchersPage";
import AccountingMonthPage from "./pages/AccountingMonthPage";
import AccountingPage from "./pages/AccountingPage";
import CrewUnpaidDetailPage from "./pages/CrewUnpaidDetailPage";
import PayoutDetailPage from "./pages/PayoutDetailPage";
import PayoutsPage from "./pages/PayoutsPage";
import CrewChatsPage from "./pages/CrewChatsPage";
import CrewChatDetailPage from "./pages/CrewChatDetailPage";

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <AuthProvider>
        <Routes>
          <Route path="/connection" element={<ConnectionCheckPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/bookings" element={<BookingsPage />} />
            {/* bulk must precede :bookingId or "bulk" is captured as an appointment id */}
            <Route path="/bookings/bulk/:bulkOrderId" element={<BulkOrderDetailPage />} />
            <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
            <Route path="/crew" element={<CrewPage />} />
            <Route path="/crew/:crewId" element={<CrewDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/b2c/:customerId" element={<B2cDetailPage />} />
            <Route path="/customers/fleets/:fleetId" element={<FleetDetailPage />} />
            <Route
              path="/customers/fleets/:fleetId/branches/:branchId"
              element={<FleetBranchDetailPage />}
            />
            <Route path="/customers/partners/:partnerId" element={<PartnerDetailPage />} />
            <Route
              path="/customers/partners/:partnerId/referred"
              element={<PartnerReferredPage />}
            />
            <Route path="/customers/vehicles/:vehicleId" element={<VehicleDetailPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route path="/crew-chats" element={<CrewChatsPage />} />
            <Route path="/crew-chats/:threadId" element={<CrewChatDetailPage />} />
            <Route path="/vouchers" element={<VouchersPage />} />
            <Route path="/vouchers/:kind/:voucherId" element={<VoucherDetailPage />} />
            <Route path="/payouts" element={<PayoutsPage />} />
            {/* unpaid must precede :kind or "unpaid" is captured as a payout kind */}
            <Route path="/payouts/unpaid/:crewMemberId" element={<CrewUnpaidDetailPage />} />
            <Route path="/payouts/:kind/:payoutId" element={<PayoutDetailPage />} />
            <Route path="/accounting" element={<AccountingPage />} />
            <Route path="/accounting/:year/:month" element={<AccountingMonthPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
