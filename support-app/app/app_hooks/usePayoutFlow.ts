/**
 * Payout detail screen: mark partner or crew payout as paid with confirm dialog.
 */
import { useCallback, useState } from "react";
import { useAlertContext } from "@/app/contexts/AlertContext";
import type { CrewPayoutQueueItem, PartnerPayoutQueueItem } from "@/app/interfaces/PayoutInterface";
import {
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

  return {
    paymentReference,
    setPaymentReference,
    adminNotes,
    setAdminNotes,
    isSubmitting: partnerLoading || crewLoading,
    requestMarkPartnerPaid,
    requestMarkCrewPaid,
  };
}
