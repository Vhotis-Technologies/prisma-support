/**
 * Payout flows: mark partner/crew queue payouts as paid, and record crew bank
 * transfers from the unpaid-earnings detail screen.
 */
import { useCallback, useState } from "react";
import { useAlertContext } from "@/app/contexts/AlertContext";
import type {
  CrewPayoutQueueItem,
  CrewUnpaidDetail,
  PartnerPayoutQueueItem,
} from "@/app/interfaces/PayoutInterface";
import {
  useMarkCrewPayoutPaidMutation,
  useMarkPartnerPayoutPaidMutation,
  useRecordCrewPaymentMadeMutation,
} from "@/app/store/api/payoutApi";

function getErrMsg(e: unknown): string {
  if (!e || typeof e !== "object") return "Something went wrong";
  const data = (e as { data?: unknown }).data;
  if (typeof data === "object" && data !== null && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) return err;
  }
  if (typeof data === "string" && data.trim()) return data;
  return "Something went wrong";
}

export function usePayoutFlow() {
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const [markPartnerPaid, { isLoading: partnerLoading }] = useMarkPartnerPayoutPaidMutation();
  const [markCrewPaid, { isLoading: crewLoading }] = useMarkCrewPayoutPaidMutation();
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

  const requestMarkCrewPaid = useCallback(
    (item: CrewPayoutQueueItem, onSuccess?: () => void) => {
      const amount = item.amount.toFixed(2);
      setAlertConfig({
        isVisible: true,
        title: "Mark crew payout as paid?",
        message: `Confirm payment of £${amount} to ${item.crew_member_name}. Their payout status will update in the crew app.`,
        type: "warning",
        confirmLabel: "Mark paid",
        onClose: () => setIsVisible(false),
        onConfirm: () => {
          void (async () => {
            try {
              await markCrewPaid({
                payout_request_id: item.id,
                payment_reference: paymentReference.trim() || undefined,
                admin_notes: adminNotes.trim() || undefined,
              }).unwrap();
              setPaymentReference("");
              setAdminNotes("");
              showSuccess(
                `Crew payout of £${amount} has been recorded.`,
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
      markCrewPaid,
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
    isSubmitting: partnerLoading || crewLoading || recordingCrewPayment,
    requestMarkPartnerPaid,
    requestMarkCrewPaid,
    requestRecordCrewPaymentMade,
  };
}
