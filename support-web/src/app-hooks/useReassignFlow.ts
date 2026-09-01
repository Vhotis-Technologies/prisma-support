/**
 * Crew reassignment for a single appointment or a bulk order.
 * Express jobs require `required_count` replacements; bulk orders need at least one.
 * The new crew is notified; the customer is not.
 * @module app-hooks/useReassignFlow
 */
import { useCallback, useMemo, useState } from "react";
import {
  getBulkReassignmentCandidates,
  getReassignmentCandidates,
  reassignSupportBooking,
  reassignSupportBulkOrder,
} from "../store/api/bookingApi";
import type {
  ReassignmentCandidate,
  ReassignmentCandidatesPayload,
  ReassignmentReasonCode,
} from "../types/booking";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type Notice } from "../lib/load";

export type ReassignTargetKind = "appointment" | "bulk_order";

export type ReassignFlowOptions = {
  kind: ReassignTargetKind;
  targetId: string;
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

export function useReassignFlow({ kind, targetId, onSuccess }: ReassignFlowOptions) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const reset = useCallback(() => {
    setSelectedIds([]);
    setCandidates([]);
    setRequirement(null);
    setReasonCode("illness");
    setReasonNotes("");
    setError(null);
  }, []);

  const close = useCallback(() => {
    if (isSubmitting || confirmBusy) return;
    setVisible(false);
    reset();
  }, [confirmBusy, isSubmitting, reset]);

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

  const open = useCallback(() => {
    if (!targetId) return;
    setVisible(true);
    setIsLoading(true);
    setError(null);
    const request =
      kind === "bulk_order"
        ? getBulkReassignmentCandidates(targetId)
        : getReassignmentCandidates(targetId);
    void request
      .then(applyPayload)
      .catch((err: unknown) => {
        setVisible(false);
        reset();
        setError(loadError(err, "Could not load detailers"));
      })
      .finally(() => setIsLoading(false));
  }, [applyPayload, kind, reset, targetId]);

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

  const submit = useCallback(() => {
    if (!requirement) return;
    if (selectedIds.length < 1) {
      setError("Select at least one replacement detailer.");
      return;
    }
    if (!requirement.is_bulk && selectedIds.length !== requirement.required_count) {
      setError(
        requirement.is_express
          ? "Express jobs need exactly two replacement detailers."
          : "Pick exactly one replacement detailer.",
      );
      return;
    }

    setConfirm({
      title: "Confirm reassignment",
      message: requirement.is_bulk
        ? `Reassign all ${requirement.job_count} vehicles to the selected ${selectedIds.length} detailer(s)? The new team will be notified; the customer will not.`
        : "Reassign this booking to the selected detailer(s)? The new crew will be notified; the customer will not.",
      confirmLabel: "Reassign crew",
      tone: "warning",
      onConfirm: () => {
        setConfirmBusy(true);
        setIsSubmitting(true);
        const body = {
          new_detailer_ids: selectedIds,
          reason_code: reasonCode,
          reason_notes: reasonNotes.trim() || undefined,
        };
        const request =
          kind === "bulk_order"
            ? reassignSupportBulkOrder({ bulkOrderId: targetId, ...body })
            : reassignSupportBooking({ bookingId: targetId, ...body });
        void request
          .then(() => {
            setConfirm(null);
            setConfirmBusy(false);
            setIsSubmitting(false);
            setVisible(false);
            reset();
            setNotice({
              type: "ok",
              message: requirement.is_bulk
                ? "The bulk order team was updated and notified."
                : "The new crew was assigned and notified.",
            });
            onSuccess?.();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setIsSubmitting(false);
            setConfirm(null);
            setError(loadError(err, "Could not reassign crew"));
          });
      },
    });
  }, [
    kind,
    onSuccess,
    reasonCode,
    reasonNotes,
    requirement,
    reset,
    selectedIds,
    targetId,
  ]);

  const canSubmit = useMemo(() => {
    if (!requirement) return false;
    if (requirement.is_bulk) return selectedIds.length >= 1;
    return selectedIds.length === requirement.required_count;
  }, [requirement, selectedIds.length]);

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  return {
    visible,
    open,
    close,
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
    error,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
  };
}

export type ReassignFlow = ReturnType<typeof useReassignFlow>;
