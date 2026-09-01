/**
 * Partner payout queue and crew unpaid / pending / paid lists.
 * Cache is keyed by the active tab so a switch shows loading without setState in the effect.
 *
 * @module app-hooks/usePayoutsListFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCrewPayoutQueue,
  getCrewUnpaidEarnings,
  getPartnerPayoutQueue,
} from "../store/api/payoutApi";
import type {
  CrewPayoutQueueItem,
  CrewUnpaidSummary,
  PartnerPayoutQueueItem,
  PayoutTabKind,
} from "../types/payout";
import { loadError, type LoadState } from "../lib/load";

export type CrewPayoutSubTab = "unpaid" | "pending" | "paid";
export type PayoutListKey = "partner" | "crew-unpaid" | "crew-pending" | "crew-paid";

export const PAYOUT_TABS: { value: PayoutTabKind; label: string }[] = [
  { value: "partner", label: "Partners" },
  { value: "crew", label: "Crew" },
];

export const CREW_PAYOUT_SUB_TABS: { value: CrewPayoutSubTab; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
];

type PartnerCache = { key: "partner"; state: LoadState<PartnerPayoutQueueItem[]> };
type UnpaidCache = { key: "crew-unpaid"; state: LoadState<CrewUnpaidSummary[]> };
type CrewQueueCache = {
  key: "crew-pending" | "crew-paid";
  state: LoadState<CrewPayoutQueueItem[]>;
};
type ListCache = PartnerCache | UnpaidCache | CrewQueueCache;

function listKey(tab: PayoutTabKind, sub: CrewPayoutSubTab): PayoutListKey {
  return tab === "partner" ? "partner" : (`crew-${sub}` as PayoutListKey);
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

async function fetchList(key: PayoutListKey): Promise<ListCache> {
  if (key === "partner") {
    return { key, state: { status: "ok", data: await getPartnerPayoutQueue() } };
  }
  if (key === "crew-unpaid") {
    return { key, state: { status: "ok", data: await getCrewUnpaidEarnings() } };
  }
  const rows =
    key === "crew-paid" ? await getCrewPayoutQueue("completed") : await getCrewPayoutQueue();
  return { key, state: { status: "ok", data: rows } };
}

export function usePayoutsListFlow() {
  const [tab, setTab] = useState<PayoutTabKind>("partner");
  const [crewSubTab, setCrewSubTab] = useState<CrewPayoutSubTab>("unpaid");
  const [searchQuery, setSearchQuery] = useState("");
  const [cache, setCache] = useState<ListCache>({
    key: "partner",
    state: { status: "loading" },
  });
  const [refreshing, setRefreshing] = useState(false);

  const key = listKey(tab, crewSubTab);

  useEffect(() => {
    let cancelled = false;
    void fetchList(key)
      .then((next) => {
        if (!cancelled) setCache(next);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            key,
            state: {
              status: "error",
              message: loadError(
                err,
                "Could not load payouts. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
              ),
            },
          } as ListCache);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loadKey = useCallback((nextKey: PayoutListKey, asRefresh: boolean) => {
    if (asRefresh) setRefreshing(true);
    void fetchList(nextKey)
      .then(setCache)
      .catch((err: unknown) => {
        setCache({
          key: nextKey,
          state: { status: "error", message: loadError(err, "Could not load payouts") },
        } as ListCache);
      })
      .finally(() => {
        if (asRefresh) setRefreshing(false);
      });
  }, []);

  const onSelectTab = useCallback(
    (value: PayoutTabKind) => {
      const nextKey = listKey(value, crewSubTab);
      if (value === tab) {
        loadKey(nextKey, true);
        return;
      }
      setSearchQuery("");
      setTab(value);
    },
    [crewSubTab, loadKey, tab],
  );

  const onSelectCrewSubTab = useCallback(
    (value: CrewPayoutSubTab) => {
      const nextKey = listKey("crew", value);
      if (value === crewSubTab && tab === "crew") {
        loadKey(nextKey, true);
        return;
      }
      setSearchQuery("");
      setTab("crew");
      setCrewSubTab(value);
    },
    [crewSubTab, loadKey, tab],
  );

  const onRefresh = useCallback(() => {
    loadKey(key, true);
  }, [key, loadKey]);

  const matched = cache.key === key;
  const isLoading = !matched || cache.state.status === "loading";
  const errorMessage = matched && cache.state.status === "error" ? cache.state.message : null;

  const partnerRows = useMemo(
    () =>
      matched && cache.key === "partner" && cache.state.status === "ok" ? cache.state.data : [],
    [cache, matched],
  );
  const unpaidRows = useMemo(
    () =>
      matched && cache.key === "crew-unpaid" && cache.state.status === "ok"
        ? cache.state.data
        : [],
    [cache, matched],
  );
  const crewQueueRows = useMemo(
    () =>
      matched &&
      (cache.key === "crew-pending" || cache.key === "crew-paid") &&
      cache.state.status === "ok"
        ? cache.state.data
        : [],
    [cache, matched],
  );

  const q = normalizeQuery(searchQuery);

  const filteredPartners = useMemo(() => {
    if (!q) return partnerRows;
    return partnerRows.filter(
      (row) =>
        row.partner_name.toLowerCase().includes(q) ||
        row.partner_user_email.toLowerCase().includes(q),
    );
  }, [partnerRows, q]);

  const filteredUnpaid = useMemo(() => {
    if (!q) return unpaidRows;
    return unpaidRows.filter(
      (row) =>
        row.crew_member_name.toLowerCase().includes(q) ||
        row.crew_member_email.toLowerCase().includes(q),
    );
  }, [q, unpaidRows]);

  const filteredCrewQueue = useMemo(() => {
    if (!q) return crewQueueRows;
    return crewQueueRows.filter(
      (row) =>
        row.crew_member_name.toLowerCase().includes(q) ||
        row.crew_member_email.toLowerCase().includes(q) ||
        row.payout_reference.toLowerCase().includes(q),
    );
  }, [crewQueueRows, q]);

  const count =
    tab === "partner"
      ? partnerRows.length
      : crewSubTab === "unpaid"
        ? unpaidRows.length
        : crewQueueRows.length;
  const shown =
    tab === "partner"
      ? filteredPartners.length
      : crewSubTab === "unpaid"
        ? filteredUnpaid.length
        : filteredCrewQueue.length;

  const queueHint = isLoading
    ? tab === "partner"
      ? "Loading payouts…"
      : crewSubTab === "unpaid"
        ? "Loading unpaid earnings…"
        : crewSubTab === "pending"
          ? "Loading pending payouts…"
          : "Loading paid crew payments…"
    : searchQuery.trim() && count > 0
      ? `${count} · showing ${shown}`
      : tab === "partner"
        ? count === 0
          ? "No pending partner payout requests"
          : `${count} partner payout${count === 1 ? "" : "s"} awaiting payment`
        : crewSubTab === "unpaid"
          ? count === 0
            ? "No crew with unpaid earnings"
            : `${count} crew member${count === 1 ? "" : "s"} with unpaid earnings`
          : crewSubTab === "pending"
            ? count === 0
              ? "No pending crew payouts"
              : `${count} crew payout${count === 1 ? "" : "s"} awaiting bank transfer`
            : count === 0
              ? "No completed crew payments"
              : `${count} crew payment${count === 1 ? "" : "s"} completed`;

  const lede =
    tab === "partner"
      ? "Partner commission payout requests. The server re-validates the amount against the partner's approved balance before completing the transfer."
      : crewSubTab === "unpaid"
        ? "Crew members can't request payouts — support pays them directly. Open a member to record a bank transfer or create a pending payout."
        : crewSubTab === "pending"
          ? "Payouts created but not yet marked paid. Complete the bank transfer, then mark as paid."
          : "Payments support has recorded for crew.";

  return {
    tab,
    crewSubTab,
    onSelectTab,
    onSelectCrewSubTab,
    searchQuery,
    setSearchQuery,
    isLoading,
    errorMessage,
    queueHint,
    lede,
    refreshing,
    onRefresh,
    filteredPartners,
    filteredUnpaid,
    filteredCrewQueue,
  };
}
