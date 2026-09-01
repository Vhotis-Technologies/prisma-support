/**
 * Partner or crew payout detail. Mark-paid records the bank transfer and notifies
 * the partner / updates crew payout history.
 *
 * @module app-hooks/usePayoutFlow
 */
import { useCallback, useEffect, useState } from "react";
import {
  getCrewPayoutDetail,
  getPartnerPayoutQueue,
  markCrewPayoutPaid,
  markPartnerPayoutPaid,
} from "../store/api/payoutApi";
import type {
  CrewPayoutQueueItem,
  PartnerPayoutQueueItem,
  PayoutTabKind,
} from "../types/payout";
import type { ConfirmRequest } from "../lib/confirm";
import { formatCurrency } from "../lib/format";
import { type LoadState, type Notice } from "../lib/load";
import { payoutError } from "../lib/payoutError";

type PartnerCache = { id: string; kind: "partner"; state: LoadState<PartnerPayoutQueueItem> };
type CrewCache = { id: string; kind: "crew"; state: LoadState<CrewPayoutQueueItem> };
type Cache = PartnerCache | CrewCache;

export type PayoutNoteFields = {
  paymentReference: string;
  adminNotes: string;
};

export function usePayoutFlow(payoutId: string, kind: PayoutTabKind) {
  const [cache, setCache] = useState<Cache>({
    id: "",
    kind: "partner",
    state: { status: "loading" },
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    if (!payoutId) return;
    let cancelled = false;
    const request =
      kind === "crew"
        ? getCrewPayoutDetail(payoutId).then((row) => {
            if (!row) throw new Error("Payment not found");
            return row;
          })
        : getPartnerPayoutQueue().then((rows) => {
            const row = rows.find((item) => item.id === payoutId);
            if (!row) throw new Error("Payout not found");
            return row;
          });
    void request
      .then((data) => {
        if (cancelled) return;
        if (kind === "crew") {
          setCache({ id: payoutId, kind: "crew", state: { status: "ok", data: data as CrewPayoutQueueItem } });
        } else {
          setCache({
            id: payoutId,
            kind: "partner",
            state: { status: "ok", data: data as PartnerPayoutQueueItem },
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCache({
          id: payoutId,
          kind,
          state: {
            status: "error",
            message: payoutError(err, "Could not load payout"),
          },
        } as Cache);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, payoutId]);

  const matched = cache.id === payoutId && cache.kind === kind;
  const partner =
    matched && cache.kind === "partner" && cache.state.status === "ok"
      ? cache.state.data
      : undefined;
  const crew =
    matched && cache.kind === "crew" && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = Boolean(payoutId) && (!matched || cache.state.status === "loading");
  const isError =
    !payoutId || (matched && cache.state.status === "error") || (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : kind === "crew"
        ? "This payment record could not be loaded."
        : "This request may have already been processed.";

  const canMarkPartnerPaid = Boolean(
    partner && ["pending", "processing"].includes(partner.status),
  );
  const canMarkCrewPaid = Boolean(crew && ["pending", "processing"].includes(crew.status));

  const refetch = useCallback(() => {
    if (!payoutId) return;
    if (kind === "crew") {
      void getCrewPayoutDetail(payoutId)
        .then((row) => {
          if (!row) throw new Error("Payment not found");
          setCache({ id: payoutId, kind: "crew", state: { status: "ok", data: row } });
        })
        .catch((err: unknown) => {
          setCache({
            id: payoutId,
            kind: "crew",
            state: { status: "error", message: payoutError(err, "Could not load payout") },
          });
        });
      return;
    }
    void getPartnerPayoutQueue()
      .then((rows) => {
        const row = rows.find((item) => item.id === payoutId);
        if (!row) throw new Error("Payout not found");
        setCache({ id: payoutId, kind: "partner", state: { status: "ok", data: row } });
      })
      .catch((err: unknown) => {
        setCache({
          id: payoutId,
          kind: "partner",
          state: { status: "error", message: payoutError(err, "Could not load payout") },
        });
      });
  }, [kind, payoutId]);

  const requestMarkPartnerPaid = useCallback(
    (fields: PayoutNoteFields) => {
      if (!partner || !canMarkPartnerPaid) return;
      setConfirm({
        title: "Mark partner payout as paid?",
        message: `Confirm payment of ${formatCurrency(partner.amount_requested)} to ${partner.partner_name}. This will notify the partner.`,
        confirmLabel: "Mark paid",
        tone: "warning",
        onConfirm: () => {
          setConfirmBusy(true);
          void markPartnerPayoutPaid({
            payout_request_id: partner.id,
            payment_reference: fields.paymentReference.trim() || undefined,
            admin_notes: fields.adminNotes.trim() || undefined,
            confirmed_amount: partner.amount_requested,
          })
            .then(() => {
              setConfirm(null);
              setConfirmBusy(false);
              setCache({
                id: payoutId,
                kind: "partner",
                state: {
                  status: "ok",
                  data: { ...partner, status: "paid" },
                },
              });
              setNotice({
                type: "ok",
                message: `Partner payout of ${formatCurrency(partner.amount_requested)} has been recorded.`,
              });
            })
            .catch((err: unknown) => {
              setConfirmBusy(false);
              setConfirm(null);
              setNotice({
                type: "error",
                message: payoutError(err, "Could not complete payout"),
              });
            });
        },
      });
    },
    [canMarkPartnerPaid, partner, payoutId],
  );

  const requestMarkCrewPaid = useCallback(
    (fields: PayoutNoteFields) => {
      if (!crew || !canMarkCrewPaid) return;
      setConfirm({
        title: "Mark crew payout as paid?",
        message: `Confirm ${formatCurrency(crew.amount)} paid to ${crew.crew_member_name} after bank transfer.`,
        confirmLabel: "Mark paid",
        tone: "warning",
        onConfirm: () => {
          setConfirmBusy(true);
          void markCrewPayoutPaid({
            payout_request_id: crew.id,
            payment_reference: fields.paymentReference.trim() || undefined,
            admin_notes: fields.adminNotes.trim() || undefined,
          })
            .then(() => {
              setConfirm(null);
              setConfirmBusy(false);
              setCache({
                id: payoutId,
                kind: "crew",
                state: {
                  status: "ok",
                  data: { ...crew, status: "completed" },
                },
              });
              setNotice({
                type: "ok",
                message: `Crew payout of ${formatCurrency(crew.amount)} has been recorded.`,
              });
            })
            .catch((err: unknown) => {
              setConfirmBusy(false);
              setConfirm(null);
              setNotice({
                type: "error",
                message: payoutError(err, "Could not complete payout"),
              });
            });
        },
      });
    },
    [canMarkCrewPaid, crew, payoutId],
  );

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    partner,
    crew,
    isLoading,
    isError,
    errorMessage,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    canMarkPartnerPaid,
    canMarkCrewPaid,
    requestMarkPartnerPaid,
    requestMarkCrewPaid,
  };
}
