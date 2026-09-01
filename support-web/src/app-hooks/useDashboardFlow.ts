/**
 * Dashboard metrics, upcoming confirmed bookings, and open tickets.
 *
 * Preview filtering uses `Date.now()` in the fetch `.then` (not during render)
 * to satisfy react-hooks purity. Push-permission UI from the mobile app is omitted.
 *
 * @module app-hooks/useDashboardFlow
 */
import { useCallback, useEffect, useState } from "react";
import { getSupportBookingsList } from "../store/api/bookingApi";
import { getDashboardMetrics } from "../store/api/dashboardApi";
import { getSupportTicketsList } from "../store/api/ticketApi";
import type { SupportBookingListRow } from "../types/booking";
import type { DashboardMetricsResult, DashboardTimeframe } from "../types/dashboard";
import type { TicketListItem } from "../types/ticket";
import { loadError, type LoadState } from "../lib/load";

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

/** Include confirmed rows this long after appointment start (in-progress / recent). */
const DASHBOARD_BOOKING_LOOKBACK_MS = 12 * 60 * 60 * 1000;

function parseSupportListAppointmentMs(appointment_date: string): number | null {
  const s = appointment_date.trim();
  if (!s) return null;
  const match = /^(\d{1,2}) (\w{3}) (\d{4})(?:, (\d{2}):(\d{2}))?$/.exec(s);
  if (!match) return null;
  const day = Number(match[1]);
  const month = APPOINTMENT_MONTHS[match[2]];
  const year = Number(match[3]);
  if (month === undefined || !Number.isFinite(day) || !Number.isFinite(year)) {
    return null;
  }
  const hour = match[4] != null ? Number(match[4]) : 0;
  const minute = match[5] != null ? Number(match[5]) : 0;
  if (match[4] != null && (!Number.isFinite(hour) || !Number.isFinite(minute))) {
    return null;
  }
  return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

export const DASHBOARD_TIMEFRAME_OPTIONS: {
  value: DashboardTimeframe;
  label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "30days", label: "30 days" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

async function fetchMetrics(timeframe: DashboardTimeframe): Promise<LoadState<DashboardMetricsResult>> {
  try {
    return { status: "ok", data: await getDashboardMetrics(timeframe) };
  } catch (err) {
    return {
      status: "error",
      message: loadError(
        err,
        "Could not load metrics. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
      ),
    };
  }
}

async function fetchBookings(): Promise<LoadState<SupportBookingListRow[]>> {
  try {
    return { status: "ok", data: await getSupportBookingsList() };
  } catch (err) {
    return { status: "error", message: loadError(err, "Could not load bookings") };
  }
}

async function fetchTickets(): Promise<LoadState<TicketListItem[]>> {
  try {
    return { status: "ok", data: await getSupportTicketsList() };
  } catch (err) {
    return { status: "error", message: loadError(err, "Could not load tickets") };
  }
}

function selectUpcomingConfirmed(
  rows: SupportBookingListRow[],
  nowMs: number,
): SupportBookingListRow[] {
  const cutoff = nowMs - DASHBOARD_BOOKING_LOOKBACK_MS;
  return rows
    .filter((row) => {
      if (row.status !== "confirmed") return false;
      const ts = parseSupportListAppointmentMs(row.appointment_date);
      return ts != null && ts > cutoff;
    })
    .sort((a, b) => {
      const ta = parseSupportListAppointmentMs(a.appointment_date) ?? 0;
      const tb = parseSupportListAppointmentMs(b.appointment_date) ?? 0;
      return ta - tb;
    })
    .slice(0, 2);
}

function selectAttentionTickets(rows: TicketListItem[]): TicketListItem[] {
  return [...rows]
    .filter((ticket) => ticket.status !== "resolved" && ticket.status !== "closed")
    .sort(
      (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
    )
    .slice(0, 3);
}

export function useDashboardFlow() {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>("daily");
  const [metrics, setMetrics] = useState<LoadState<DashboardMetricsResult>>({
    status: "loading",
  });
  const [bookings, setBookings] = useState<LoadState<SupportBookingListRow[]>>({
    status: "loading",
  });
  const [tickets, setTickets] = useState<LoadState<TicketListItem[]>>({
    status: "loading",
  });
  const [bookingsPreview, setBookingsPreview] = useState<SupportBookingListRow[]>([]);
  const [attentionTickets, setAttentionTickets] = useState<TicketListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchMetrics(timeframe).then((result) => {
      if (!cancelled) setMetrics(result);
    });
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchBookings(), fetchTickets()]).then(([bookingResult, ticketResult]) => {
      if (cancelled) return;
      setBookings(bookingResult);
      setTickets(ticketResult);
      setBookingsPreview(
        bookingResult.status === "ok"
          ? // Date.now() here (not during render) — react-hooks/purity
            selectUpcomingConfirmed(bookingResult.data, Date.now())
          : [],
      );
      setAttentionTickets(
        ticketResult.status === "ok" ? selectAttentionTickets(ticketResult.data) : [],
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSelectTimeframe = useCallback(
    (value: DashboardTimeframe) => {
      if (value === timeframe) {
        setMetrics({ status: "loading" });
        void fetchMetrics(value).then(setMetrics);
        return;
      }
      setMetrics({ status: "loading" });
      setTimeframe(value);
    },
    [timeframe],
  );

  return {
    timeframe,
    onSelectTimeframe,
    metrics,
    bookings,
    tickets,
    bookingsPreview,
    attentionTickets,
  };
}

