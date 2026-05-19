/**
 * Payout flows: mark partner/crew queue payouts as paid, and record crew bank
 * transfers from the unpaid-earnings detail screen.
 */
import { useCallback, useState } from "react";
import { useAlertContext } from "@/app/contexts/AlertContext";
import type {
  CrewUnpaidDetail,
  PartnerPayoutQueueItem,
} from "@/app/interfaces/PayoutInterface";
import {
  useMarkPartnerPayoutPaidMutation,
  useRecordCrewPaymentMadeMutation,
} from "@/app/store/api/payoutApi";

function getErrMsg(e: unknown): string {
  if (!e || typeof e !== "object") return "Something went wrong";
  const errObj = e as { data?: unknown; status?: number };
  const data = errObj.data;
  if (typeof data === "object" && data !== null && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  if (typeof data === "string" && data.trim()) {
    if (data.includes("<!DOCTYPE html>") || data.includes("Server Error")) {
      return "Server error while saving. Check detailer logs — the payment may still have been recorded.";
    }
    return data;
  }
  if (errObj.status === 500) {
    return "Server error while saving. Check detailer logs — the payment may still have been recorded.";
  }
  return "Something went wrong";
}

export function usePayoutFlow() {
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const [markPartnerPaid, { isLoading: partnerLoading }] = useMarkPartnerPayoutPaidMutation();
  const [recordCrewPayment, { isLoading: recordingCrewPayment }] =
    useRecordCrewPaymentMadeMutation();
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const showError = useCallback(
    (title: string, message: string) => {
      setAlertConfig({
        isVisible: true,
        title,
        message,
        type: "error",
        confirmLabel: "OK",
        onConfirm: () => setIsVisible(false),
      });
    },
    [setAlertConfig, setIsVisible],
  );

  const showSuccess = useCallback(
    (message: string, onDone?: () => void) => {
      setAlertConfig({
        isVisible: true,
        title: "Payout completed",
        message,
        type: "success",
        confirmLabel: "OK",
        onConfirm: () => {
          setIsVisible(false);
          onDone?.();
        },
      });
    },
    [setAlertConfig, setIsVisible],
  );

  const requestMarkPartnerPaid = useCallback(
    (item: PartnerPayoutQueueItem, onSuccess?: () => void) => {
      const amount = item.amount_requested.toFixed(2);
      setAlertConfig({
        isVisible: true,
        title: "Mark partner payout as paid?",
        message: `Confirm payment of £${amount} to ${item.partner_name}. This will notify the partner.`,
        type: "warning",
        confirmLabel: "Mark paid",
        onClose: () => setIsVisible(false),
        onConfirm: () => {
          void (async () => {
            try {
              await markPartnerPaid({
                payout_request_id: item.id,
                payment_reference: paymentReference.trim() || undefined,
                admin_notes: adminNotes.trim() || undefined,
                confirmed_amount: item.amount_requested,
              }).unwrap();
              setPaymentReference("");
              setAdminNotes("");
              showSuccess(
                `Partner payout of £${amount} has been recorded.`,
                onSuccess,
              );
            } catch (e) {
              setIsVisible(false);
              showError("Could not complete payout", getErrMsg(e));
            }
          })();
        },
      });
    },
    [
      adminNotes,
      markPartnerPaid,
      paymentReference,
      setAlertConfig,
      setIsVisible,
      showError,
      showSuccess,
    ],
  );

  const requestRecordCrewPaymentMade = useCallback(
    (detail: CrewUnpaidDetail, onSuccess?: () => void) => {
      const amount = detail.unpaid_amount.toFixed(2);
      const bank = detail.bank_account;
      const bankLine =
        bank?.has_bank_account && bank.account_name
          ? ` to ${bank.account_name}${bank.iban ? ` (${bank.iban})` : ""}`
          : "";
      setAlertConfig({
        isVisible: true,
        title: "Confirm payment made?",
        message:
          `Record £${amount} for ${detail.unpaid_job_count} job` +
          `${detail.unpaid_job_count === 1 ? "" : "s"} paid to ` +
          `${detail.crew_member_name}${bankLine}. ` +
          `This updates payout history in the crew app.`,
        type: "warning",
        confirmLabel: "Payment made",
        onClose: () => setIsVisible(false),
        onConfirm: () => {
          void (async () => {
            try {
              await recordCrewPayment({
                crew_member_id: detail.crew_member_id,
                payment_reference: paymentReference.trim() || undefined,
                admin_notes: adminNotes.trim() || undefined,
              }).unwrap();
              setPaymentReference("");
              setAdminNotes("");
              showSuccess(
                `Payment of £${amount} for ${detail.crew_member_name} has been recorded.`,
                onSuccess,
              );
            } catch (e) {
              setIsVisible(false);
              showError("Could not record payment", getErrMsg(e));
            }
          })();
        },
      });
    },
    [
      adminNotes,
      paymentReference,
      recordCrewPayment,
      setAlertConfig,
      setIsVisible,
      showError,
      showSuccess,
    ],
  );

  return {
    paymentReference,
    setPaymentReference,
    adminNotes,
    setAdminNotes,
    isSubmitting: partnerLoading || recordingCrewPayment,
    requestMarkPartnerPaid,
    requestRecordCrewPaymentMade,
  };
}
