/**
 * Winner or gift voucher detail. Deactivate is irreversible and skipped for
 * unpaid gift vouchers (they are not live until Stripe confirms payment).
 *
 * @module app-hooks/useVoucherFlow
 */
import { useCallback, useEffect, useState } from "react";
import { getVoucherDetail, updateVoucher } from "../store/api/voucherApi";
import { getGiftVoucherDetail, updateGiftVoucher } from "../store/api/giftVoucherApi";
import type { VoucherDetails, VoucherKind } from "../types/voucher";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type LoadState, type Notice } from "../lib/load";

type Cache = {
  id: string;
  kind: VoucherKind;
  state: LoadState<VoucherDetails>;
  nowMs: number;
};

async function fetchDetail(voucherId: string, kind: VoucherKind): Promise<VoucherDetails> {
  return kind === "gift" ? getGiftVoucherDetail(voucherId) : getVoucherDetail(voucherId);
}

export function useVoucherFlow(voucherId: string, kind: VoucherKind) {
  const [cache, setCache] = useState<Cache>({
    id: "",
    kind: "winner",
    state: { status: "loading" },
    nowMs: 0,
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    if (!voucherId) return;
    let cancelled = false;
    void fetchDetail(voucherId, kind)
      .then((data) => {
        if (!cancelled) {
          setCache({ id: voucherId, kind, state: { status: "ok", data }, nowMs: Date.now() });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCache({
            id: voucherId,
            kind,
            nowMs: 0,
            state: { status: "error", message: loadError(err, "Could not load voucher") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kind, voucherId]);

  const matched = cache.id === voucherId && cache.kind === kind;
  const voucher = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = Boolean(voucherId) && (!matched || cache.state.status === "loading");
  const isError =
    !voucherId ||
    (matched && cache.state.status === "error") ||
    (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : "This voucher may have been removed or the link is invalid.";
  const nowMs = matched ? cache.nowMs : 0;

  const canDeactivate = Boolean(
    voucher && voucher.isActive && (voucher.kind !== "gift" || voucher.isPaid),
  );

  const refetch = useCallback(() => {
    if (!voucherId) return;
    void fetchDetail(voucherId, kind)
      .then((data) => {
        setCache({ id: voucherId, kind, state: { status: "ok", data }, nowMs: Date.now() });
      })
      .catch((err: unknown) => {
        setCache({
          id: voucherId,
          kind,
          nowMs: 0,
          state: { status: "error", message: loadError(err, "Could not load voucher") },
        });
      });
  }, [kind, voucherId]);

  const requestDeactivate = useCallback(() => {
    if (!voucher || !canDeactivate) return;
    const label = kind === "winner" ? "winner" : "gift";
    const code = voucher.code ? ` (${voucher.code})` : "";
    setConfirm({
      title: "Deactivate voucher?",
      message: `Deactivate this ${label} voucher${code}? This cannot be undone.`,
      confirmLabel: "Deactivate",
      tone: "danger",
      onConfirm: () => {
        setConfirmBusy(true);
        const request =
          kind === "gift"
            ? updateGiftVoucher({ voucherId: voucher.id, is_active: false })
            : updateVoucher({ voucherId: voucher.id, is_active: false });
        void request
          .then((data) => {
            setConfirm(null);
            setConfirmBusy(false);
            setCache({
              id: voucherId,
              kind,
              state: { status: "ok", data },
              nowMs: Date.now(),
            });
            setNotice({ type: "ok", message: "Voucher deactivated." });
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({
              type: "error",
              message: loadError(err, "Could not deactivate voucher"),
            });
          });
      },
    });
  }, [canDeactivate, kind, voucher, voucherId]);

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    voucher,
    isLoading,
    isError,
    errorMessage,
    nowMs,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    canDeactivate,
    requestDeactivate,
  };
}
