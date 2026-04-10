/**
 * Home dashboard orchestration for the support app.
 *
 * Pulls **metrics** (timeframe chips + comparison cards) and **bookings list** from RTK Query,
 * derives a short preview of confirmed appointments (including a 12h lookback for in-progress),
 * surfaces **open tickets** from the tickets API, and wires **notification opt-in** modal logic.
 * Navigation helpers route into ticket detail, booking detail / bulk order, and list screens.
 *
 * @module app_hooks/useDashboardFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Href, useRouter } from "expo-router";
import { usePermissions } from "@/app/services/usePermissions";
import { useAppSelector } from "@/app/store/main_store";
import type { SupportBookingListRow } from "@/app/interfaces/BookingInterface";
import type { TicketListItem } from "@/app/interfaces/TicketInterface";
import { useTicketFlow } from "@/app/app_hooks/useTicketFlow";
import {
  type DashboardTimeframe,
  useGetDashboardMetricsQuery,
} from "@/app/store/api/dashboardApi";
import { useGetSupportBookingsListQuery } from "@/app/store/api/bookingApi";

/** Month abbreviations from support API `strftime("%d %b %Y")` (English). */
const APPOINTMENT_MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

/** Include confirmed rows up to this long after the appointment start (e.g. in-progress / recent). */
const DASHBOARD_BOOKING_LOOKBACK_MS = 12 * 60 * 60 * 1000;

/** Parse list row `appointment_date`: "18 Mar 2025, 10:00" or "18 Mar 2025". */
function parseSupportListAppointmentMs(appointment_date: string): number | null {
  const s = appointment_date.trim();
  if (!s) return null;
  const m = /^(\d{1,2}) (\w{3}) (\d{4})(?:, (\d{2}):(\d{2}))?$/.exec(s);
  if (!m) return null;
  const day = Number(m[1]);
  const month = APPOINTMENT_MONTHS[m[2]];
  const year = Number(m[3]);
  if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) {
    return null;
  }
  const hour = m[4] != null ? Number(m[4]) : 0;
  const minute = m[5] != null ? Number(m[5]) : 0;
  if (m[4] != null && (!Number.isFinite(hour) || !Number.isFinite(minute))) {
    return null;
  }
  return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

/** Labels for dashboard metric window selector (must match API `timeframe` values). */
export const DASHBOARD_TIMEFRAME_OPTIONS: {
  value: DashboardTimeframe;
  label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "30days", label: "30 days" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

/**
 * @returns Screen-ready state and callbacks for the home dashboard screen component.
 */
export function useDashboardFlow() {
  const user = useAppSelector((s) => s.auth.user);
  const access = useAppSelector((s) => s.auth.access);
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>("daily");
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetDashboardMetricsQuery(timeframe, {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });

  const onSelectTimeframe = useCallback(
    (value: DashboardTimeframe) => {
      if (timeframe === value) {
        void refetch();
      } else {
        setTimeframe(value);
      }
    },
    [timeframe, refetch],
  );

  const metrics = data?.metrics ?? [];
  const meta = data?.meta;

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [hasAskedForPermissions, setHasAskedForPermissions] = useState(false);

  const { tickets } = useTicketFlow();
  const router = useRouter();
  const { permissionStatus, isLoading: permissionsLoading } = usePermissions();

  const {
    data: bookingsListData,
    isLoading: bookingsListLoading,
    isError: bookingsListError,
  } = useGetSupportBookingsListQuery(undefined, {
    skip: !access,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (
      !permissionsLoading &&
      !permissionStatus.notifications.granted &&
      !hasAskedForPermissions &&
      user?.allow_push_notifications !== false
    ) {
      const timer = setTimeout(() => {
        setShowNotificationModal(true);
        setHasAskedForPermissions(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    permissionsLoading,
    permissionStatus.notifications.granted,
    hasAskedForPermissions,
    user?.allow_push_notifications,
  ]);

  const bookingsPreview = useMemo(() => {
    const rows = bookingsListData ?? [];
    const now = Date.now();
    const cutoff = now - DASHBOARD_BOOKING_LOOKBACK_MS;
    const upcomingConfirmed = rows
      .filter((row) => {
        if (row.status !== "confirmed") return false;
        const ts = parseSupportListAppointmentMs(row.appointment_date);
        return ts != null && ts > cutoff;
      })
      .sort((a, b) => {
        const ta = parseSupportListAppointmentMs(a.appointment_date) ?? 0;
        const tb = parseSupportListAppointmentMs(b.appointment_date) ?? 0;
        return ta - tb;
      });
    return upcomingConfirmed.slice(0, 2);
  }, [bookingsListData]);

  const attentionTickets = useMemo(() => {
    return [...tickets]
      .filter((t) => t.status !== "resolved" && t.status !== "closed")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 3);
  }, [tickets]);

  const onTicketPress = useCallback(
    (ticket: TicketListItem) => {
      router.push({
        pathname: "/main/tickets/TicketDetailScreen",
        params: { id: ticket.id },
      } as Href);
    },
    [router],
  );

  const onBookingPress = useCallback(
    (booking: SupportBookingListRow) => {
      if (booking.kind === "bulk_order") {
        router.push({
          pathname: "/main/bookings/BulkOrderDetailsScreen",
          params: { id: booking.bulk_order_id },
        } as Href);
        return;
      }
      router.push({
        pathname: "/main/bookings/BookingDetailsScreen",
        params: { id: booking.id },
      } as Href);
    },
    [router],
  );

  const goTickets = useCallback(() => {
    router.push("/main/tickets/TicketScreen" as Href);
  }, [router]);

  const goBookings = useCallback(() => {
    router.push("/main/bookings/BookingScreen" as Href);
  }, [router]);

  const closeNotificationModal = useCallback(() => {
    setShowNotificationModal(false);
  }, []);

  const onNotificationPermissionGranted = useCallback(() => {
    setShowNotificationModal(false);
    setHasAskedForPermissions(true);
  }, []);

  return {
    timeframe,
    onSelectTimeframe,
    metrics,
    meta,
    isLoading,
    isFetching,
    isError,
    showNotificationModal,
    closeNotificationModal,
    onNotificationPermissionGranted,
    bookingsListData,
    bookingsListLoading,
    bookingsListError,
    bookingsPreview,
    attentionTickets,
    onTicketPress,
    onBookingPress,
    goTickets,
    goBookings,
  };
}
