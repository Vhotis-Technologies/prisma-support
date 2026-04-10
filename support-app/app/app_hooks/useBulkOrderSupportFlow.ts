/**
 * Fleet bulk order detail: load rollup, cancel entire order, reschedule via detailer bulk API.
 */
import { useCallback, useMemo, useState } from "react";
import type { BulkOrderDetailResponse } from "@/app/interfaces/BookingInterface";
import {
  useGetSupportBulkOrderDetailQuery,
  useLazyGetBulkRescheduleSlotsQuery,
  useCancelSupportBulkOrderMutation,
  useRescheduleSupportBulkOrderMutation,
} from "@/app/store/api/bookingApi";
import { useAlertContext } from "@/app/contexts/AlertContext";

function getErrMsg(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const raw = (e as { data?: unknown }).data;
    if (raw && typeof raw === "object" && "error" in raw) {
      const err = (raw as { error?: string }).error;
      if (typeof err === "string") return err;
    }
  }
  return "Something went wrong";
}

export function canModifyBulkOrder(detail: BulkOrderDetailResponse | undefined): boolean {
  if (!detail?.bulk_order) return false;
  if (detail.bulk_order.payment_status === "cancelled") return false;
  const appts = detail.appointments ?? [];
  if (appts.length === 0) return false;
  return !appts.every((a) => a.status === "cancelled" || a.status === "completed");
}

export function useBulkOrderSupportFlow(bulkOrderId: string) {
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const { data, isLoading, isError, refetch, isFetching } = useGetSupportBulkOrderDetailQuery(
    bulkOrderId,
    { skip: !bulkOrderId },
  );

  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [fetchBulkSlots, { isFetching: slotsLoading }] = useLazyGetBulkRescheduleSlotsQuery();
  const [cancelBulk, { isLoading: cancelLoading }] = useCancelSupportBulkOrderMutation();
  const [rescheduleBulk, { isLoading: rescheduleSubmitting }] =
    useRescheduleSupportBulkOrderMutation();

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

  const canModify = useMemo(() => canModifyBulkOrder(data), [data]);

  const openReschedule = useCallback(() => {
    if (!data?.appointments?.[0]) return;
    const first = data.appointments[0];
    setRescheduleDate((first.appointment_date_iso ?? "").slice(0, 10));
    setRescheduleSlots([]);
    setSelectedSlot(first.start_time_hhmm ?? "");
    setRescheduleVisible(true);
  }, [data]);

  const loadRescheduleSlots = useCallback(async () => {
    if (!bulkOrderId || !rescheduleDate.trim()) {
      showError("Date required", "Enter a date (YYYY-MM-DD).");
      return;
    }
    try {
      const slots = await fetchBulkSlots({
        bulkOrderId,
        date: rescheduleDate.trim().slice(0, 10),
      }).unwrap();
      setRescheduleSlots(slots);
      if (slots.length > 0) {
        setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : slots[0]));
      }
    } catch (e: unknown) {
      showError("Availability", getErrMsg(e));
    }
  }, [bulkOrderId, rescheduleDate, fetchBulkSlots, showError]);

  const confirmReschedule = useCallback(async () => {
    if (!bulkOrderId || !rescheduleDate.trim()) {
      showError("Select date", "Enter a date and load available slots.");
      return;
    }
    if (!selectedSlot) {
      showError("Select time", "Choose a time slot.");
      return;
    }
    const newDate = rescheduleDate.trim().slice(0, 10);
    const newTime = selectedSlot.length >= 5 ? selectedSlot.slice(0, 5) : selectedSlot;
    try {
      await rescheduleBulk({ bulkOrderId, new_date: newDate, new_time: newTime }).unwrap();
      setRescheduleVisible(false);
      await refetch();
      setAlertConfig({
        isVisible: true,
        title: "Rescheduled",
        message: "The bulk order was updated for all vehicles.",
        type: "success",
        confirmLabel: "OK",
        onConfirm: () => setIsVisible(false),
      });
    } catch (e: unknown) {
      showError("Error", getErrMsg(e));
    }
  }, [
    bulkOrderId,
    rescheduleDate,
    selectedSlot,
    rescheduleBulk,
    refetch,
    setAlertConfig,
    setIsVisible,
    showError,
  ]);

  const requestCancelBulkOrder = useCallback(() => {
    if (!data?.bulk_order) return;
    const { booking_reference, number_of_vehicles } = data.bulk_order;
    setAlertConfig({
      isVisible: true,
      title: "Cancel fleet bulk order",
      message: `Cancel ${booking_reference} (${number_of_vehicles} vehicles)? All line appointments will be cancelled and paid orders refunded per fleet policy.`,
      type: "warning",
      confirmLabel: "Cancel bulk order",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            await cancelBulk({ bulkOrderId }).unwrap();
            await refetch();
            setAlertConfig({
              isVisible: true,
              title: "Cancelled",
              message: "The bulk order and its appointments were cancelled.",
              type: "success",
              confirmLabel: "OK",
              onConfirm: () => setIsVisible(false),
            });
          } catch (e: unknown) {
            showError("Error", getErrMsg(e));
          }
        })();
      },
    });
  }, [bulkOrderId, cancelBulk, data?.bulk_order, refetch, setAlertConfig, setIsVisible, showError]);

  const rescheduleBusy = slotsLoading || rescheduleSubmitting;

  return {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    canModify,
    openReschedule,
    rescheduleVisible,
    setRescheduleVisible,
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
    cancelLoading,
    requestCancelBulkOrder,
  };
}
