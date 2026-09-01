/**
 * Bookings list with client-side search (same fields as the support app).
 * @module app-hooks/useBookingsListFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupportBookingsList } from "../store/api/bookingApi";
import type { SupportBookingListRow } from "../types/booking";
import { loadError, type LoadState } from "../lib/load";

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function rowMatchesSearch(row: SupportBookingListRow, q: string): boolean {
  if (!q) return true;
  const name = (row.client_name ?? "").toLowerCase();
  const ref = (row.booking_reference ?? "").toLowerCase();
  return name.includes(q) || ref.includes(q);
}

export function useBookingsListFlow() {
  const [searchQuery, setSearchQuery] = useState("");
  const [guestOnly, setGuestOnly] = useState(false);
  const [rows, setRows] = useState<LoadState<SupportBookingListRow[]>>({
    status: "loading",
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSupportBookingsList()
      .then((data) => {
        if (!cancelled) setRows({ status: "ok", data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRows({
            status: "error",
            message: loadError(
              err,
              "Could not load bookings. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
            ),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void getSupportBookingsList()
      .then((data) => setRows({ status: "ok", data }))
      .catch((err: unknown) => {
        setRows({
          status: "error",
          message: loadError(err, "Could not load bookings"),
        });
      })
      .finally(() => setRefreshing(false));
  }, []);

  const filtered = useMemo(() => {
    const data = rows.status === "ok" ? rows.data : [];
    const q = normalizeQuery(searchQuery);
    return data.filter((row) => {
      if (guestOnly && row.kind === "appointment" && !row.is_guest) return false;
      if (guestOnly && row.kind === "bulk_order" && !row.is_guest) return false;
      return rowMatchesSearch(row, q);
    });
  }, [rows, searchQuery, guestOnly]);

  const total = rows.status === "ok" ? rows.data.length : 0;
  const q = normalizeQuery(searchQuery);
  const queueHint =
    rows.status === "loading" && total === 0
      ? "Loading bookings…"
      : q && filtered.length !== total
        ? `${filtered.length} of ${total} appointments`
        : `${total} appointments`;

  return {
    searchQuery,
    setSearchQuery,
    guestOnly,
    setGuestOnly,
    rows,
    filtered,
    queueHint,
    refreshing,
    onRefresh,
  };
}
