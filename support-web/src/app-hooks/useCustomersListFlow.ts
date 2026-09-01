/**
 * Customer list by segment (B2C / fleets / partners). Search is client-side.
 * Switching tabs keys the cache by segment so stale rows are not shown.
 * @module app-hooks/useCustomersListFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupportCustomersList } from "../store/api/customerApi";
import type {
  CustomerSegment,
  SupportCustomerListItem,
} from "../types/customer";
import { loadError, type LoadState } from "../lib/load";

export const CUSTOMER_TABS: { value: CustomerSegment; label: string }[] = [
  { value: "b2c", label: "B2C" },
  { value: "guests", label: "Guests" },
  { value: "fleets", label: "Fleets" },
  { value: "partners", label: "Partners" },
];

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function customerMatchesSearch(item: SupportCustomerListItem, q: string): boolean {
  if (!q) return true;
  if (item.type === "b2c") {
    return (
      item.name.toLowerCase().includes(q) ||
      item.contact.email.toLowerCase().includes(q) ||
      (item.contact.phone ?? "").toLowerCase().includes(q) ||
      (item.is_guest ? "guest" : "").includes(q)
    );
  }
  if (item.type === "fleet") {
    return (
      item.name.toLowerCase().includes(q) ||
      item.fleet_owner.toLowerCase().includes(q) ||
      item.contact.email.toLowerCase().includes(q)
    );
  }
  return (
    item.business_name.toLowerCase().includes(q) ||
    item.name.toLowerCase().includes(q) ||
    item.contact.email.toLowerCase().includes(q) ||
    item.referral_code.toLowerCase().includes(q)
  );
}

/** Keyed by segment so a tab change shows loading without setState in the effect. */
type ListCache = { segment: CustomerSegment; state: LoadState<SupportCustomerListItem[]> };

export function useCustomersListFlow() {
  const [segment, setSegment] = useState<CustomerSegment>("b2c");
  const [searchQuery, setSearchQuery] = useState("");
  const [cache, setCache] = useState<ListCache>({
    segment: "b2c",
    state: { status: "loading" },
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSupportCustomersList(segment)
      .then((data) => {
        if (!cancelled) setCache({ segment, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            segment,
            state: {
              status: "error",
              message: loadError(
                err,
                "Could not load customers. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
              ),
            },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [segment]);

  const onSelectSegment = useCallback(
    (value: CustomerSegment) => {
      if (value === segment) {
        setRefreshing(true);
        void getSupportCustomersList(value)
          .then((data) => setCache({ segment: value, state: { status: "ok", data } }))
          .catch((err: unknown) => {
            setCache({
              segment: value,
              state: { status: "error", message: loadError(err, "Could not load customers") },
            });
          })
          .finally(() => setRefreshing(false));
        return;
      }
      setSearchQuery("");
      setSegment(value);
    },
    [segment],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void getSupportCustomersList(segment)
      .then((data) => setCache({ segment, state: { status: "ok", data } }))
      .catch((err: unknown) => {
        setCache({
          segment,
          state: { status: "error", message: loadError(err, "Could not load customers") },
        });
      })
      .finally(() => setRefreshing(false));
  }, [segment]);

  const rows = useMemo(
    () => (cache.segment === segment && cache.state.status === "ok" ? cache.state.data : []),
    [cache, segment],
  );
  const isLoading = cache.segment !== segment || cache.state.status === "loading";
  const errorMessage =
    cache.segment === segment && cache.state.status === "error" ? cache.state.message : null;

  const filtered = useMemo(() => {
    const q = normalizeQuery(searchQuery);
    if (!q) return rows;
    return rows.filter((row) => customerMatchesSearch(row, q));
  }, [rows, searchQuery]);

  const q = normalizeQuery(searchQuery);
  const queueHint = isLoading
    ? "Loading customers…"
    : q && filtered.length !== rows.length
      ? `${filtered.length} of ${rows.length} customers`
      : `${filtered.length} customers`;

  return {
    segment,
    onSelectSegment,
    searchQuery,
    setSearchQuery,
    filtered,
    isLoading,
    errorMessage,
    queueHint,
    refreshing,
    onRefresh,
  };
}
