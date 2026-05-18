/**
 * Crew reassignment flow for support: pick a reason, fetch available detailers from the
 * detailer API (via the support proxy + client orchestrator), select a replacement team, and
 * submit. Handles both single appointments and fleet bulk orders.
 *
 * Mirrors the confirmation pattern used by `usePayoutFlow` so UI screens just open the modal
 * and surface the returned candidate / submission state.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAlertContext } from "@/app/contexts/AlertContext";
import type {
  ReassignmentCandidate,
  ReassignmentCandidatesPayload,
  ReassignmentReasonCode,
} from "@/app/interfaces/BookingInterface";
import {
  useLazyGetBulkReassignmentCandidatesQuery,
  useLazyGetReassignmentCandidatesQuery,
  useReassignSupportBookingMutation,
  useReassignSupportBulkOrderMutation,
} from "@/app/store/api/bookingApi";

export type ReassignTargetKind = "appointment" | "bulk_order";

export type ReassignFlowOptions = {
  kind: ReassignTargetKind;
  /** Booking primary key for `appointment`, BulkOrder id for `bulk_order`. */
  targetId: string;
  /** Optional callback fired after a successful reassignment (e.g. refetch detail). */
  onSuccess?: () => void;
};

export const REASSIGNMENT_REASONS: { code: ReassignmentReasonCode; label: string }[] = [
  { code: "illness", label: "Crew illness" },
  { code: "emergency", label: "Personal emergency" },
  { code: "vehicle_issue", label: "Vehicle / equipment issue" },
  { code: "no_show", label: "Crew no-show" },
  { code: "schedule_conflict", label: "Schedule conflict" },
  { code: "other", label: "Other" },
];

function getErrMsg(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const d = (e as { data?: { error?: string } }).data;
    if (d?.error) return d.error;
  }
  return "Something went wrong";
}

export function useReassignFlow({ kind, targetId, onSuccess }: ReassignFlowOptions) {
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const [visible, setVisible] = useState(false);
  const [reasonCode, setReasonCode] = useState<ReassignmentReasonCode>("illness");
  const [reasonNotes, setReasonNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<ReassignmentCandidate[]>([]);
  const [requirement, setRequirement] = useState<{
    is_express: boolean;
    is_bulk: boolean;
    required_count: number;
    job_count: number;
  } | null>(null);

  const [fetchSingle, { isFetching: singleFetching }] = useLazyGetReassignmentCandidatesQuery();
  const [fetchBulk, { isFetching: bulkFetching }] = useLazyGetBulkReassignmentCandidatesQuery();
  const [reassignSingle, { isLoading: singleSubmitting }] = useReassignSupportBookingMutation();
  const [reassignBulk, { isLoading: bulkSubmitting }] = useReassignSupportBulkOrderMutation();

  const isLoading = singleFetching || bulkFetching;
  const isSubmitting = singleSubmitting || bulkSubmitting;

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
    (message: string) => {
      setAlertConfig({
        isVisible: true,
        title: "Crew reassigned",
        message,
        type: "success",
        confirmLabel: "OK",
        onConfirm: () => {
          setIsVisible(false);
          onSuccess?.();
        },
      });
    },
    [onSuccess, setAlertConfig, setIsVisible],
  );

  const reset = useCallback(() => {
    setSelectedIds([]);
    setCandidates([]);
    setRequirement(null);
    setReasonCode("illness");
    setReasonNotes("");
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    reset();
  }, [reset]);

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  const applyPayload = useCallback((payload: ReassignmentCandidatesPayload) => {
    setCandidates(payload.candidates ?? []);
    setRequirement({
      is_express: !!payload.is_express,
      is_bulk: !!payload.is_bulk,
      required_count: Math.max(1, payload.required_count || 1),
      job_count: payload.job_count || 1,
    });
    setSelectedIds([]);
  }, []);

  const open = useCallback(async () => {
    if (!targetId) return;
    setVisible(true);
    try {
      const payload =
        kind === "bulk_order"
          ? await fetchBulk(targetId).unwrap()
          : await fetchSingle(targetId).unwrap();
      applyPayload(payload);
    } catch (e: unknown) {
      setVisible(false);
      showError("Could not load detailers", getErrMsg(e));
    }
  }, [applyPayload, fetchBulk, fetchSingle, kind, showError, targetId]);

  const refresh = useCallback(async () => {
    if (!targetId || !visible) return;
    try {
      const payload =
        kind === "bulk_order"
          ? await fetchBulk(targetId).unwrap()
          : await fetchSingle(targetId).unwrap();
      applyPayload(payload);
    } catch (e: unknown) {
      showError("Could not load detailers", getErrMsg(e));
    }
  }, [applyPayload, fetchBulk, fetchSingle, kind, showError, targetId, visible]);

  const toggleCandidate = useCallback(
    (id: string) => {
      if (!requirement) return;
      const max = requirement.required_count;
      setSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (max === 1) return [id];
        if (prev.length >= max) return [...prev.slice(1), id];
        return [...prev, id];
      });
    },
    [requirement],
  );

  const submit = useCallback(async () => {
    if (!requirement) return;
    if (selectedIds.length < 1) {
      showError("Pick a detailer", "Select at least one replacement detailer.");
      return;
    }
    if (!requirement.is_bulk && selectedIds.length !== requirement.required_count) {
      showError(
        "Pick the right number",
        requirement.is_express
          ? "Express jobs need exactly two replacement detailers."
          : "Pick exactly one replacement detailer.",
      );
      return;
    }

    setAlertConfig({
      isVisible: true,
      title: "Confirm reassignment",
      message:
        requirement.is_bulk
          ? `Reassign all ${requirement.job_count} vehicles to the selected ${selectedIds.length} detailer(s)? The new team will be notified; the customer will not.`
          : "Reassign this booking to the selected detailer(s)? The new crew will be notified; the customer will not.",
      type: "warning",
      confirmLabel: "Reassign crew",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            const body = {
              new_detailer_ids: selectedIds,
              reason_code: reasonCode,
              reason_notes: reasonNotes.trim() || undefined,
            };
            if (kind === "bulk_order") {
              await reassignBulk({ bulkOrderId: targetId, ...body }).unwrap();
            } else {
              await reassignSingle({ bookingId: targetId, ...body }).unwrap();
            }
            close();
            showSuccess(
              requirement.is_bulk
                ? "The bulk order team was updated and notified."
                : "The new crew was assigned and notified.",
            );
          } catch (e: unknown) {
            setIsVisible(false);
            showError("Error", getErrMsg(e));
          }
        })();
      },
    });
  }, [
    close,
    kind,
    reasonCode,
    reasonNotes,
    requirement,
    reassignBulk,
    reassignSingle,
    selectedIds,
    setAlertConfig,
    setIsVisible,
    showError,
    showSuccess,
    targetId,
  ]);

  const canSubmit = useMemo(() => {
    if (!requirement) return false;
    if (requirement.is_bulk) return selectedIds.length >= 1;
    return selectedIds.length === requirement.required_count;
  }, [requirement, selectedIds.length]);

  return {
    visible,
    open,
    close,
    refresh,
    isLoading,
    isSubmitting,
    candidates,
    requirement,
    reasonCode,
    setReasonCode,
    reasonNotes,
    setReasonNotes,
    selectedIds,
    toggleCandidate,
    submit,
    canSubmit,
    reasons: REASSIGNMENT_REASONS,
  };
}
