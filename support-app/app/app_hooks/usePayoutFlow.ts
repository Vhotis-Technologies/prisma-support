/**

 * Payout flows: mark partner/crew queue payouts as paid, create pending crew payouts,

 * and record crew bank transfers from the unpaid-earnings detail screen.

 */

import { useCallback, useState } from "react";

import { useAlertContext } from "@/app/contexts/AlertContext";

import type {
  CrewPayoutQueueItem,
  CrewUnpaidDetail,
  PartnerPayoutQueueItem,
} from "@/app/interfaces/PayoutInterface";

import {
  useCreateCrewPayoutMutation,
  useMarkCrewPayoutPaidMutation,
  useMarkPartnerPayoutPaidMutation,
  useRecordCrewPaymentMadeMutation,
} from "@/app/store/api/payoutApi";

import { formatCurrency } from "@/app/utils/methods";



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
  const [markCrewPaid, { isLoading: crewMarkLoading }] = useMarkCrewPayoutPaidMutation();
  const [createCrewPayout, { isLoading: crewCreateLoading }] = useCreateCrewPayoutMutation();
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
        message: `Confirm payment of ${formatCurrency(item.amount_requested)} to ${item.partner_name}. This will notify the partner.`,
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
                `Partner payout of ${formatCurrency(item.amount_requested)} has been recorded.`,
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


  const requestMarkCrewPayoutPaid = useCallback(
    (item: CrewPayoutQueueItem, onSuccess?: () => void) => {
      setAlertConfig({
        isVisible: true,
        title: "Mark crew payout as paid?",
        message: `Confirm ${formatCurrency(item.amount)} paid to ${item.crew_member_name} after bank transfer.`,
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
                `Crew payout of ${formatCurrency(item.amount)} has been recorded.`,
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



  const requestCreateCrewPayout = useCallback(
    (detail: CrewUnpaidDetail, onSuccess?: () => void) => {
      setAlertConfig({
        isVisible: true,
        title: "Create pending payout?",
        message: `Create a pending payout of ${formatCurrency(detail.unpaid_amount)} for ${detail.crew_member_name}. Mark it paid after the bank transfer.`,
        type: "warning",
        confirmLabel: "Create payout",
        onClose: () => setIsVisible(false),
        onConfirm: () => {
          void (async () => {
            try {
              await createCrewPayout({
                crew_member_id: detail.crew_member_id,
                admin_notes: adminNotes.trim() || undefined,
              }).unwrap();
              setAdminNotes("");
              showSuccess("Pending crew payout created.", onSuccess);
            } catch (e) {
              setIsVisible(false);
              showError("Could not create payout", getErrMsg(e));
            }
          })();
        },
      });
    },
    [adminNotes, createCrewPayout, setAlertConfig, setIsVisible, showError, showSuccess],
  );



  const requestRecordCrewPaymentMade = useCallback(
    (detail: CrewUnpaidDetail, onSuccess?: () => void) => {
      const bank = detail.bank_account;
      const bankLine =
        bank?.has_bank_account && bank.account_name
          ? ` to ${bank.account_name}${bank.iban_masked ? ` (${bank.iban_masked})` : ""}`
          : "";
      setAlertConfig({
        isVisible: true,
        title: "Confirm payment made?",
        message:
          `Record ${formatCurrency(detail.unpaid_amount)} for ${detail.unpaid_job_count} job` +
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
                `Payment of ${formatCurrency(detail.unpaid_amount)} for ${detail.crew_member_name} has been recorded.`,
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
    isSubmitting:
      partnerLoading || crewMarkLoading || crewCreateLoading || recordingCrewPayment,
    requestMarkPartnerPaid,
    requestMarkCrewPayoutPaid,
    requestCreateCrewPayout,
    requestRecordCrewPaymentMade,
  };
}

