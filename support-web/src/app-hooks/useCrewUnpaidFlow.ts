/**
 * Crew unpaid-earnings detail: job breakdown, bank details, record payment, or
 * create a pending payout to mark paid after the transfer.
 *
 * @module app-hooks/useCrewUnpaidFlow
 */
import { useCallback, useEffect, useState } from "react";
import { createCrewPayout, getCrewUnpaidEarningsDetail, recordCrewPaymentMade } from "../store/api/payoutApi";
import type { CrewUnpaidDetail } from "../types/payout";
import type { ConfirmRequest } from "../lib/confirm";
import { formatCurrency } from "../lib/format";
import { type LoadState, type Notice } from "../lib/load";
import { payoutError } from "../lib/payoutError";

type Cache = { id: string; state: LoadState<CrewUnpaidDetail> };

export type CrewUnpaidNoteFields = {
  paymentReference: string;
  adminNotes: string;
};

export function useCrewUnpaidFlow(crewMemberId: string) {
  const [cache, setCache] = useState<Cache>({ id: "", state: { status: "loading" } });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    if (!crewMemberId) return;
    let cancelled = false;
    void getCrewUnpaidEarningsDetail(crewMemberId)
      .then((data) => {
        if (cancelled) return;
        if (!data) throw new Error("Unpaid earnings not found");
        setCache({ id: crewMemberId, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCache({
          id: crewMemberId,
          state: { status: "error", message: payoutError(err, "Could not load unpaid earnings") },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [crewMemberId]);

  const matched = cache.id === crewMemberId;
  const detail = matched && cache.state.status === "ok" ? cache.state.data : undefined;
  const isLoading = Boolean(crewMemberId) && (!matched || cache.state.status === "loading");
  const isError =
    !crewMemberId ||
    (matched && cache.state.status === "error") ||
    (matched && cache.state.status === "ok" && !cache.state.data);
  const errorMessage =
    matched && cache.state.status === "error"
      ? cache.state.message
      : "This crew member has no unpaid earnings, or the link is invalid.";

  const refetch = useCallback(() => {
    if (!crewMemberId) return;
    void getCrewUnpaidEarningsDetail(crewMemberId)
      .then((data) => {
        if (data) {
          setCache({ id: crewMemberId, state: { status: "ok", data } });
          return;
        }
        setCache((prev) =>
          prev.state.status === "ok"
            ? {
                id: crewMemberId,
                state: {
                  status: "ok",
                  data: {
                    ...prev.state.data,
                    unpaid_amount: 0,
                    unpaid_job_count: 0,
                    earnings: [],
                  },
                },
              }
            : {
                id: crewMemberId,
                state: { status: "error", message: "Unpaid earnings not found" },
              },
        );
      })
      .catch((err: unknown) => {
        setCache({
          id: crewMemberId,
          state: { status: "error", message: payoutError(err, "Could not load unpaid earnings") },
        });
      });
  }, [crewMemberId]);

  const requestCreatePayout = useCallback(
    (fields: CrewUnpaidNoteFields) => {
      if (!detail || detail.unpaid_job_count < 1) return;
      setConfirm({
        title: "Create pending payout?",
        message: `Create a pending payout of ${formatCurrency(detail.unpaid_amount)} for ${detail.crew_member_name}. Mark it paid after the bank transfer.`,
        confirmLabel: "Create payout",
        tone: "warning",
        onConfirm: () => {
          setConfirmBusy(true);
          void createCrewPayout({
            crew_member_id: detail.crew_member_id,
            admin_notes: fields.adminNotes.trim() || undefined,
          })
            .then(() => {
              setConfirm(null);
              setConfirmBusy(false);
              setNotice({ type: "ok", message: "Pending crew payout created." });
              refetch();
            })
            .catch((err: unknown) => {
              setConfirmBusy(false);
              setConfirm(null);
              setNotice({ type: "error", message: payoutError(err, "Could not create payout") });
            });
        },
      });
    },
    [detail, refetch],
  );

  const requestRecordPayment = useCallback(
    (fields: CrewUnpaidNoteFields) => {
      if (!detail || detail.unpaid_job_count < 1) return;
      const bank = detail.bank_account;
      const bankLine =
        bank?.has_bank_account && bank.account_name
          ? ` to ${bank.account_name}${bank.iban_masked ? ` (${bank.iban_masked})` : ""}`
          : "";
      setConfirm({
        title: "Confirm payment made?",
        message:
          `Record ${formatCurrency(detail.unpaid_amount)} for ${detail.unpaid_job_count} job` +
          `${detail.unpaid_job_count === 1 ? "" : "s"} paid to ` +
          `${detail.crew_member_name}${bankLine}. ` +
          `This updates payout history in the crew app.`,
        confirmLabel: "Payment made",
        tone: "warning",
        onConfirm: () => {
          setConfirmBusy(true);
          void recordCrewPaymentMade({
            crew_member_id: detail.crew_member_id,
            payment_reference: fields.paymentReference.trim() || undefined,
            admin_notes: fields.adminNotes.trim() || undefined,
          })
            .then(() => {
              setConfirm(null);
              setConfirmBusy(false);
              setNotice({
                type: "ok",
                message: `Payment of ${formatCurrency(detail.unpaid_amount)} for ${detail.crew_member_name} has been recorded.`,
              });
              refetch();
            })
            .catch((err: unknown) => {
              setConfirmBusy(false);
              setConfirm(null);
              setNotice({
                type: "error",
                message: payoutError(err, "Could not record payment"),
              });
            });
        },
      });
    },
    [detail, refetch],
  );

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    detail,
    isLoading,
    isError,
    errorMessage,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    requestCreatePayout,
    requestRecordPayment,
  };
}
