/**
 * Appointment detail: load, reschedule (with late-change fee warning), cancel.
 *
 * Detail is cached by `bookingId` so a param change shows loading without
 * calling setState({ loading }) inside the effect (react-hooks purity).
 *
 * @param bookingId - Appointment primary key from the list / deep link.
 * @param onCancelled - Navigate back to the list after a successful cancel.
 * @module app-hooks/useBookingFlow
 */
import { useCallback, useEffect, useState } from "react";
import {
  cancelSupportBooking,
  getRescheduleSlots,
  getSupportBookingDetail,
  rescheduleIntent,
  rescheduleSupportBooking,
  resendGuestResultsEmail,
} from "../store/api/bookingApi";
import type { BookingDetails, BookingImageItem } from "../types/booking";
import type { ConfirmRequest } from "../lib/confirm";
import { formatCurrency } from "../lib/format";
import { loadError, type LoadState, type Notice } from "../lib/load";

export type BookingImageTabId =
  | "before-interior"
  | "before-exterior"
  | "after-interior"
  | "after-exterior";

export const BOOKING_IMAGE_TABS: { id: BookingImageTabId; label: string }[] = [
  { id: "before-interior", label: "Before — Interior" },
  { id: "after-interior", label: "After — Interior" },
  { id: "before-exterior", label: "Before — Exterior" },
  { id: "after-exterior", label: "After — Exterior" },
];

type DetailCache = { id: string; state: LoadState<BookingDetails> };

export function useBookingFlow(bookingId: string, onCancelled?: () => void) {
  const [detail, setDetail] = useState<DetailCache>({
    id: "",
    state: { status: "loading" },
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const [showImages, setShowImages] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState<BookingImageTabId>("before-interior");

  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    void getSupportBookingDetail(bookingId)
      .then((data) => {
        if (!cancelled) setDetail({ id: bookingId, state: { status: "ok", data } });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDetail({
            id: bookingId,
            state: { status: "error", message: loadError(err, "Could not load booking") },
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const booking =
    detail.id === bookingId && detail.state.status === "ok" ? detail.state.data : undefined;
  const isLoading = Boolean(bookingId) && (detail.id !== bookingId || detail.state.status === "loading");
  const isError =
    !bookingId ||
    (detail.id === bookingId && detail.state.status === "error") ||
    (detail.id === bookingId && detail.state.status === "ok" && !detail.state.data);
  const errorMessage =
    detail.id === bookingId && detail.state.status === "error"
      ? detail.state.message
      : "This link may be invalid, or the booking was removed.";

  const refetch = useCallback(() => {
    if (!bookingId) return;
    void getSupportBookingDetail(bookingId)
      .then((data) => setDetail({ id: bookingId, state: { status: "ok", data } }))
      .catch((err: unknown) => {
        setDetail({
          id: bookingId,
          state: { status: "error", message: loadError(err, "Could not load booking") },
        });
      });
  }, [bookingId]);

  const getTabImages = useCallback(
    (tabId: BookingImageTabId): BookingImageItem[] => {
      if (!booking?.booking_images) return [];
      switch (tabId) {
        case "before-interior":
          return booking.booking_images.before_images_interior ?? [];
        case "before-exterior":
          return booking.booking_images.before_images_exterior ?? [];
        case "after-interior":
          return booking.booking_images.after_images_interior ?? [];
        case "after-exterior":
          return booking.booking_images.after_images_exterior ?? [];
        default:
          return [];
      }
    },
    [booking],
  );

  const openReschedule = useCallback(() => {
    if (!booking) return;
    setRescheduleDate((booking.appointment_date_iso ?? "").slice(0, 10));
    setRescheduleSlots([]);
    setSelectedSlot(booking.start_time_hhmm ?? "");
    setRescheduleVisible(true);
  }, [booking]);

  const closeReschedule = useCallback(() => {
    setRescheduleVisible(false);
  }, []);

  const loadRescheduleSlots = useCallback(() => {
    if (!bookingId || !rescheduleDate.trim()) {
      setNotice({ type: "error", message: "Enter a date, then load available times." });
      return;
    }
    setSlotsLoading(true);
    void getRescheduleSlots(bookingId, rescheduleDate.trim().slice(0, 10))
      .then((slots) => {
        setRescheduleSlots(slots);
        setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : slots[0] ?? ""));
      })
      .catch((err: unknown) => {
        setNotice({ type: "error", message: loadError(err, "Could not load availability") });
      })
      .finally(() => setSlotsLoading(false));
  }, [bookingId, rescheduleDate]);

  const runReschedule = useCallback(() => {
    if (!booking) return;
    const newDate = rescheduleDate.trim().slice(0, 10);
    const newTime = selectedSlot.length >= 5 ? selectedSlot.slice(0, 5) : selectedSlot;
    setRescheduleSubmitting(true);
    setConfirm(null);
    setConfirmBusy(false);
    void rescheduleSupportBooking({
      bookingId,
      booking_reference: booking.booking_reference,
      new_date: newDate,
      new_time: newTime,
    })
      .then(() => {
        setRescheduleVisible(false);
        setNotice({
          type: "ok",
          message: "The booking was updated and the client was notified.",
        });
        refetch();
      })
      .catch((err: unknown) => {
        setNotice({ type: "error", message: loadError(err, "Could not reschedule") });
      })
      .finally(() => setRescheduleSubmitting(false));
  }, [booking, bookingId, refetch, rescheduleDate, selectedSlot]);

  const confirmReschedule = useCallback(() => {
    if (!booking || !rescheduleDate.trim()) {
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
    void rescheduleIntent({
      booking_reference: booking.booking_reference,
      new_date: newDate,
      new_time: newTime,
    })
      .then((intent) => {
        setRescheduleSubmitting(false);
        // Support cannot collect the client late-reschedule fee; warn then continue.
        if (intent.requires_fee) {
          const fee =
            intent.fee_amount_cents > 0
              ? ` (${formatCurrency(intent.fee_amount_cents / 100)})`
              : "";
          setConfirm({
            title: "Reschedule fee may apply",
            message: `This change is within 12 hours of the original appointment. The client app normally charges a fee for late reschedule${fee}; continuing will apply the new slot without collecting that fee here.`,
            confirmLabel: "Continue",
            tone: "warning",
            onConfirm: runReschedule,
          });
          return;
        }
        runReschedule();
      })
      .catch((err: unknown) => {
        setRescheduleSubmitting(false);
        setNotice({ type: "error", message: loadError(err, "Could not reschedule") });
      });
  }, [booking, rescheduleDate, selectedSlot, runReschedule]);

  const requestCancelBooking = useCallback(() => {
    if (!booking) return;
    setConfirm({
      title: "Cancel appointment",
      message: `Cancel ${booking.booking_reference} for ${booking.client_name}? This may process refunds per policy.`,
      confirmLabel: "Cancel appointment",
      tone: "danger",
      onConfirm: () => {
        setConfirmBusy(true);
        void cancelSupportBooking(booking.booking_reference)
          .then(() => {
            setConfirm(null);
            setConfirmBusy(false);
            onCancelled?.();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({ type: "error", message: loadError(err, "Could not cancel booking") });
          });
      },
    });
  }, [booking, onCancelled]);

  const onEditDetails = useCallback(() => {
    setNotice({
      type: "error",
      message:
        "Editing service type, valet package, add-ons, or address from the support portal is not available yet.",
    });
  }, []);

  const requestResendGuestEmail = useCallback(() => {
    if (!booking?.is_guest) return;
    setConfirm({
      title: "Resend guest portal email",
      message: `Send a fresh results link to ${booking.client_email}? Previous links for this booking will stop working.`,
      confirmLabel: "Send email",
      tone: "primary",
      onConfirm: () => {
        setConfirmBusy(true);
        void resendGuestResultsEmail(bookingId)
          .then((data) => {
            setConfirm(null);
            setConfirmBusy(false);
            setNotice({
              type: "ok",
              message: data.message || "Guest portal email queued.",
            });
            refetch();
          })
          .catch((err: unknown) => {
            setConfirmBusy(false);
            setConfirm(null);
            setNotice({ type: "error", message: loadError(err, "Could not resend guest email") });
          });
      },
    });
  }, [booking, bookingId, refetch]);

  const clearConfirm = useCallback(() => {
    if (confirmBusy) return;
    setConfirm(null);
  }, [confirmBusy]);

  const canModify = !!(booking && !["cancelled", "completed"].includes(booking.status));
  const showImageAction = booking?.status === "completed";
  const rescheduleBusy = slotsLoading || rescheduleSubmitting;

  return {
    booking,
    isLoading,
    isError,
    errorMessage,
    refetch,
    notice,
    clearNotice: () => setNotice(null),
    confirm,
    confirmBusy,
    clearConfirm,
    showImages,
    setShowImages,
    activeImageTab,
    setActiveImageTab,
    imageTabs: BOOKING_IMAGE_TABS,
    getTabImages,
    canModify,
    showImageAction,
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
    requestCancelBooking,
    onEditDetails,
    requestResendGuestEmail,
  };
}
