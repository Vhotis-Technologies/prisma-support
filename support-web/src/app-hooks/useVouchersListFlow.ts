/**
 * Winner and gift voucher lists. Tabs key the cache so a switch shows loading
 * without setState in the effect. Winner create is the only write on this screen.
 *
 * @module app-hooks/useVouchersListFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createVoucher, getVouchersList } from "../store/api/voucherApi";
import { getGiftVouchersList } from "../store/api/giftVoucherApi";
import type { CreateVoucherBody, VoucherDetails, VoucherKind } from "../types/voucher";
import { loadError, type LoadState, type Notice } from "../lib/load";

export const VOUCHER_TABS: { value: VoucherKind; label: string }[] = [
  { value: "winner", label: "Winner" },
  { value: "gift", label: "Gifting" },
];

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function voucherMatchesSearch(voucher: VoucherDetails, q: string): boolean {
  if (!q) return true;
  return (
    voucher.code.toLowerCase().includes(q) ||
    voucher.assignedEmail.toLowerCase().includes(q) ||
    (voucher.assignedUserLabel ?? "").toLowerCase().includes(q)
  );
}

function sortNewest(rows: VoucherDetails[]): VoucherDetails[] {
  return [...rows].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

async function fetchTab(kind: VoucherKind): Promise<VoucherDetails[]> {
  const rows = kind === "gift" ? await getGiftVouchersList() : await getVouchersList();
  return sortNewest(rows);
}

/** Keyed by tab so a switch shows loading without setState in the effect. */
type ListCache = { kind: VoucherKind; state: LoadState<VoucherDetails[]>; nowMs: number };

export function useVouchersListFlow() {
  const [kind, setKind] = useState<VoucherKind>("winner");
  const [searchQuery, setSearchQuery] = useState("");
  const [cache, setCache] = useState<ListCache>({
    kind: "winner",
    state: { status: "loading" },
    nowMs: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchTab(kind)
      .then((data) => {
        if (!cancelled) setCache({ kind, state: { status: "ok", data }, nowMs: Date.now() });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            kind,
            nowMs: 0,
            state: {
              status: "error",
              message: loadError(
                err,
                "Could not load vouchers. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the support server.",
              ),
            },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  const onSelectKind = useCallback(
    (value: VoucherKind) => {
      if (value === kind) {
        setRefreshing(true);
        void fetchTab(value)
          .then((data) => setCache({ kind: value, state: { status: "ok", data }, nowMs: Date.now() }))
          .catch((err: unknown) => {
            setCache({
              kind: value,
              nowMs: 0,
              state: { status: "error", message: loadError(err, "Could not load vouchers") },
            });
          })
          .finally(() => setRefreshing(false));
        return;
      }
      setSearchQuery("");
      setNotice(null);
      setKind(value);
    },
    [kind],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchTab(kind)
      .then((data) => setCache({ kind, state: { status: "ok", data }, nowMs: Date.now() }))
      .catch((err: unknown) => {
        setCache({
          kind,
          nowMs: 0,
          state: { status: "error", message: loadError(err, "Could not load vouchers") },
        });
      })
      .finally(() => setRefreshing(false));
  }, [kind]);

  const createWinner = useCallback(async (body: CreateVoucherBody) => {
    const created = await createVoucher(body);
    try {
      const data = await fetchTab("winner");
      setKind("winner");
      setCache({ kind: "winner", state: { status: "ok", data }, nowMs: Date.now() });
    } catch {
      /* voucher exists; list catches up on refresh */
    }
    setNotice({ type: "ok", message: `Created voucher ${created.code}.` });
  }, []);

  const matched = cache.kind === kind;
  const rows = useMemo(
    () => (matched && cache.state.status === "ok" ? cache.state.data : []),
    [cache, matched],
  );
  const isLoading = !matched || cache.state.status === "loading";
  const errorMessage = matched && cache.state.status === "error" ? cache.state.message : null;
  const nowMs = matched ? cache.nowMs : 0;

  const filtered = useMemo(() => {
    const q = normalizeQuery(searchQuery);
    if (!q) return rows;
    return rows.filter((voucher) => voucherMatchesSearch(voucher, q));
  }, [rows, searchQuery]);

  const queueHint = isLoading
    ? "Loading vouchers…"
    : searchQuery.trim() && rows.length > 0
      ? `${rows.length} vouchers · showing ${filtered.length}`
      : `${rows.length} voucher${rows.length === 1 ? "" : "s"}`;

  return {
    kind,
    onSelectKind,
    searchQuery,
    setSearchQuery,
    filtered,
    isLoading,
    errorMessage,
    queueHint,
    refreshing,
    onRefresh,
    nowMs,
    notice,
    clearNotice: () => setNotice(null),
    createWinner,
  };
}
