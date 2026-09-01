/**
 * Fleet bulk-order detail: cancel the whole order, reschedule all vehicles together.
 * Line appointments (BULK…-1) cannot use the single-appointment cancel flow.
 * @module app-hooks/useBulkOrderSupportFlow
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cancelSupportBulkOrder,
  getBulkRescheduleSlots,
  getSupportBulkOrderDetail,
  rescheduleSupportBulkOrder,
} from "../store/api/bookingApi";
import type { BulkOrderDetailResponse } from "../types/booking";
import type { ConfirmRequest } from "../lib/confirm";
import { loadError, type LoadState, type Notice } from "../lib/load";

export function canModifyBulkOrder(detail: BulkOrderDetailResponse | undefined): boolean {
  if (!detail?.bulk_order) return false;
  if (detail.bulk_order.payment_status === "cancelled") return false;
  const appts = detail.appointments ?? [];
  if (appts.length === 0) return false;
  return !appts.every((a) => a.status === "cancelled" || a.status === "completed");
}

/** Keyed by bulk order id so a param change shows loading without setState in the effect. */
type DetailCache = { id: string; state: LoadState<BulkOrderDetailResponse> };

export function useBulkOrderSupportFlow(bulkOrderId: string) {
  const [detail, setDetail] = useState<DetailCache>({
    id: "",
    state: { status: "loading" },
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  useEffect(() => {
    if (!bulkOrderId) return;
    let cancelled = false;
    void getSupportBulkOrderDetail(bulkOrderId)
      .then((data) => {
        if (!cancelled) setDetail({ id: bulkOrderId, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDetail({
            id: bulkOrderId,
            state: { status: "error", message: loadError(err, "Could not load bulk order") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bulkOrderId]);

  const data =
    detail.id === bulkOrderId && detail.state.status === "ok" ? detail.state.data : undefined;
  const isLoading =
    Boolean(bulkOrderId) && (detail.id !== bulkOrderId || detail.state.status === "loading");
  const isError =
    !bulkOrderId ||
    (detail.id === bulkOrderId && detail.state.status === "error") ||
    (detail.id === bulkOrderId && detail.state.status === "ok" && !detail.state.data);
  const errorMessage =
    detail.id === bulkOrderId && detail.state.status === "error"
      ? detail.state.message
      : "Could not load bulk order.";

  const refetch = useCallback(() => {
    if (!bulkOrderId) return;
    void getSupportBulkOrderDetail(bulkOrderId)
      .then((next) => setDetail({ id: bulkOrderId, state: { status: "ok", data: next } }))
      .catch((err: unknown) => {
        setDetail({
          id: bulkOrderId,
          state: { status: "error", message: loadError(err, "Could not load bulk order") },
        });
      });
  }, [bulkOrderId]);

  const canModify = useMemo(() => canModifyBulkOrder(data), [data]);

  const openReschedule = useCallback(() => {
    if (!data?.appointments?.[0]) return;
    const first = data.appointments[0];
    setRescheduleDate((first.appointment_date_iso ?? "").slice(0, 10));
    setRescheduleSlots([]);
    setSelectedSlot(first.start_time_hhmm ?? "");
    setRescheduleVisible(true);
  }, [data]);

  const closeReschedule = useCallback(() => {
    setRescheduleVisible(false);
  }, []);

  const loadRescheduleSlots = useCallback(() => {
    if (!bulkOrderId || !rescheduleDate.trim()) {
      setNotice({ type: "error", message: "Enter a date, then load available times." });
      return;
    }
    setSlotsLoading(true);
    void getBulkRescheduleSlots(bulkOrderId, rescheduleDate.trim().slice(0, 10))
      .then((slots) => {
        setRescheduleSlots(slots);
        setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : slots[0] ?? ""));
      })
      .catch((err: unknown) => {
        setNotice({ type: "error", message: loadError(err, "Could not load availability") });
      })
      .finally(() => setSlotsLoading(false));
  }, [bulkOrderId, rescheduleDate]);

  const confirmReschedule = useCallback(() => {
    if (!bulkOrderId || !rescheduleDate.trim()) {
      setNotice({ type: "error", message: "Enter a date and load available slots." });
      return;
    }
    if (!selectedSlot) {
      setNotice({ type: "error", message: "Choose a time slot." });
      return;
    }
    const newDate = rescheduleDate.trim().slice(0, 10);
    const newTime = selectedSlot.length >= 5 ? selectedSlot.slice(0, 5) : selectedSlot;
    setRescheduleSubmitting(true);
    void rescheduleSupportBulkOrder({ bulkOrderId, new_date: newDate, new_time: newTime })
      .then(() => {
        setRescheduleVisible(false);
        setNotice({ type: "ok", message: "The bulk order was updated for all vehicles." });
        refetch();
      })
      .catch((err: unknown) => {
        setNotice({ type: "error", message: loadError(err, "Could not reschedule bulk order") });
      })
      .finally(() => setRescheduleSubmitting(false));
  }, [bulkOrderId, rescheduleDate, selectedSlot, refetch]);

  const requestCancelBulkOrder = useCallback(() => {
    if (!data?.bulk_order) return;
    const { booking_reference, number_of_vehicles } = data.bulk_order;
    setConfirm({
      title: "Cancel fleet bulk order",
      message: `Cancel ${booking_reference} (${number_of_vehicles} vehicles)? All line appointments will be cancelled and paid orders refunded per fleet policy.`,
      confirmLabel: "Cancel bulk order",
      tone: "danger",
      onConfirm: () => {
        setConfirmBusy(true);
        void cancelSupportBulkOrder(bulkOrderId)
          .then(() => {
            setConfirm(null);
            setConfirmBusy(false);
            setNotice({
              type: "ok",
              message: "The bulk order and its appointments were cancelled.",
            });
            refetch();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({
              type: "error",
              message: loadError(err, "Could not cancel bulk order"),
            });
          });
      },
    });
  }, [bulkOrderId, data, refetch]);

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  const rescheduleBusy = slotsLoading || rescheduleSubmitting;

  return {
    data,
    isLoading,
    isError,
    errorMessage,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    canModify,
    openReschedule,
    closeReschedule,
    rescheduleVisible,
    rescheduleDate,
    setRescheduleDate,
    rescheduleSlots,
    selectedSlot,
    setSelectedSlot,
    loadRescheduleSlots,
    confirmReschedule,
    rescheduleBusy,
    slotsLoading,
    rescheduleSubmitting,
    requestCancelBulkOrder,
  };
}
