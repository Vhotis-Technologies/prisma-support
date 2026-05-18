/**
 * Payout detail screen: mark partner or crew payout as paid with confirm dialog.
 * Also exposes a helper for support to create a new crew payout from unpaid earnings.
 */
import { useCallback, useState } from "react";
import { useAlertContext } from "@/app/contexts/AlertContext";
import type {
  CrewPayoutQueueItem,
  CrewUnpaidSummary,
  PartnerPayoutQueueItem,
} from "@/app/interfaces/PayoutInterface";
import {
  useCreateCrewPayoutMutation,
  useMarkCrewPayoutPaidMutation,
  useMarkPartnerPayoutPaidMutation,
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
  const [createCrewPayout, { isLoading: creatingCrewPayout }] = useCreateCrewPayoutMutation();
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

  const requestCreateCrewPayout = useCallback(
    (item: CrewUnpaidSummary, onSuccess?: () => void) => {
      const amount = item.unpaid_amount.toFixed(2);
      setAlertConfig({
        isVisible: true,
        title: "Create payout for crew member?",
        message:
          `Bundle ${item.unpaid_job_count} unpaid job` +
          `${item.unpaid_job_count === 1 ? "" : "s"}` +
          ` (£${amount}) for ${item.crew_member_name} into a new payout. ` +
          `It will appear in the Crew tab as pending until you mark it paid.`,
        type: "warning",
        confirmLabel: "Create payout",
        onClose: () => setIsVisible(false),
        onConfirm: () => {
          void (async () => {
            try {
              await createCrewPayout({
                crew_member_id: item.crew_member_id,
                admin_notes: adminNotes.trim() || undefined,
              }).unwrap();
              setAdminNotes("");
              setAlertConfig({
                isVisible: true,
                title: "Payout created",
                message:
                  `Payout of £${amount} for ${item.crew_member_name} is now pending. ` +
                  `Open it from the Crew tab and mark it paid after the bank transfer.`,
                type: "success",
                confirmLabel: "OK",
                onConfirm: () => {
                  setIsVisible(false);
                  onSuccess?.();
                },
              });
            } catch (e) {
              setIsVisible(false);
              showError("Could not create payout", getErrMsg(e));
            }
          })();
        },
      });
    },
    [
      adminNotes,
      createCrewPayout,
      setAdminNotes,
      setAlertConfig,
      setIsVisible,
      showError,
    ],
  );

  return {
    paymentReference,
    setPaymentReference,
    adminNotes,
    setAdminNotes,
    isSubmitting: partnerLoading || crewLoading || creatingCrewPayout,
    requestMarkPartnerPaid,
    requestMarkCrewPaid,
    requestCreateCrewPayout,
  };
}
