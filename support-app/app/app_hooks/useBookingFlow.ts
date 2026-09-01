/**
 * Single-booking detail screen logic: load detail, gallery tabs, contact actions,
 * reschedule flow (slots, fee intent, submit), cancel with confirmation, and placeholder “edit”.
 *
 * All mutations go through `bookingApi`; errors are surfaced via `AlertContext`.
 *
 * @module app_hooks/useBookingFlow
 */
import { useCallback, useMemo, useState } from "react";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import type { BookingDetails, BookingImageItem } from "@/app/interfaces/BookingInterface";
import {
  useGetSupportBookingDetailQuery,
  useLazyGetRescheduleSlotsQuery,
  useCancelSupportBookingMutation,
  useRescheduleIntentMutation,
  useRescheduleSupportBookingMutation,
  useResendGuestResultsEmailMutation,
} from "@/app/store/api/bookingApi";
import { useAlertContext } from "@/app/contexts/AlertContext";

/** Keys for the job-image gallery grouped by segment (interior/exterior) and phase (before/after). */
export type BookingImageTabId =
  | "before-interior"
  | "before-exterior"
  | "after-interior"
  | "after-exterior";

/** Best-effort message extraction from RTK Query / axios error shapes. */
function getErrMsg(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const d = (e as { data?: { error?: string } }).data;
    if (d?.error) return d.error;
  }
  return "Something went wrong";
}

/**
 * @param bookingId - Primary key from the bookings list / deep link.
 */
export function useBookingFlow(bookingId: string) {
  const router = useRouter();
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const { data: booking, isLoading, isError, refetch } = useGetSupportBookingDetailQuery(
    bookingId,
    { skip: !bookingId, refetchOnMountOrArgChange: false }
  );

  const [showImagesModal, setShowImagesModal] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState<BookingImageTabId>("before-interior");

  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [fetchSlots, { isFetching: slotsLoading }] = useLazyGetRescheduleSlotsQuery();
  const [cancelSupportBooking, { isLoading: cancelLoading }] = useCancelSupportBookingMutation();
  const [rescheduleIntent, { isLoading: intentLoading }] = useRescheduleIntentMutation();
  const [rescheduleBooking, { isLoading: rescheduleSubmitting }] =
    useRescheduleSupportBookingMutation();
  const [resendGuestResultsEmail, { isLoading: resendGuestEmailLoading }] =
    useResendGuestResultsEmailMutation();

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
    [setAlertConfig, setIsVisible]
  );

  const openCall = useCallback((phone: string) => {
    const cleaned = phone.replace(/\s/g, "");
    Linking.openURL(`tel:${cleaned}`).catch(() => {});
  }, []);

  const openEmail = useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`).catch(() => {});
  }, []);

  const openMaps = useCallback((b: BookingDetails) => {
    const { latitude, longitude } = b.address;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  }, []);

  const getTabImages = useCallback(
    (tabId: BookingImageTabId): BookingImageItem[] => {
      if (!booking?.booking_images) return [];
      switch (tabId) {
        case "before-interior":
          return booking.booking_images.before_images_interior;
        case "before-exterior":
          return booking.booking_images.before_images_exterior;
        case "after-interior":
          return booking.booking_images.after_images_interior;
        case "after-exterior":
          return booking.booking_images.after_images_exterior;
        default:
          return [];
      }
    },
    [booking]
  );

  const openReschedule = useCallback(() => {
    if (!booking) return;
    const iso = booking.appointment_date_iso ?? "";
    setRescheduleDate(iso);
    setRescheduleSlots([]);
    setSelectedSlot(booking.start_time_hhmm ?? "");
    setRescheduleVisible(true);
  }, [booking]);

  const loadRescheduleSlots = useCallback(async () => {
    if (!bookingId || !rescheduleDate.trim()) {
      showError("Date required", "Enter a date (YYYY-MM-DD).");
      return;
    }
    try {
      const slots = await fetchSlots({
        bookingId,
        date: rescheduleDate.trim().slice(0, 10),
      }).unwrap();
      setRescheduleSlots(slots);
      if (slots.length > 0) {
        setSelectedSlot((prev) => (prev && slots.includes(prev) ? prev : slots[0]));
      }
    } catch (e: unknown) {
      showError("Availability", getErrMsg(e));
    }
  }, [bookingId, rescheduleDate, fetchSlots, showError]);

  const confirmReschedule = useCallback(async () => {
    if (!booking || !rescheduleDate.trim()) {
      showError("Select date", "Enter a date and load available slots.");
      return;
    }
    if (!selectedSlot) {
      showError("Select time", "Choose a time slot.");
      return;
    }
    const newDate = rescheduleDate.trim().slice(0, 10);
    const newTime = selectedSlot.length >= 5 ? selectedSlot.slice(0, 5) : selectedSlot;

    const runReschedule = async () => {
      try {
        await rescheduleBooking({
          bookingId,
          booking_reference: booking.booking_reference,
          new_date: newDate,
          new_time: newTime,
        }).unwrap();
        setRescheduleVisible(false);
        setAlertConfig({
          isVisible: true,
          title: "Rescheduled",
          message: "The booking was updated and the client was notified.",
          type: "success",
          confirmLabel: "OK",
          onConfirm: () => setIsVisible(false),
        });
      } catch (e: unknown) {
        showError("Error", getErrMsg(e));
      }
    };

    try {
      const intent = await rescheduleIntent({
        booking_reference: booking.booking_reference,
        new_date: newDate,
        new_time: newTime,
      }).unwrap();

      if (intent.requires_fee) {
        setAlertConfig({
          isVisible: true,
          title: "Reschedule fee may apply",
          message:
            "This change is within 12 hours of the original appointment. The client app normally charges a fee for late reschedule; continuing will apply the new slot without collecting that fee here.",
          type: "warning",
          confirmLabel: "Continue",
          onClose: () => setIsVisible(false),
          onConfirm: () => {
            void runReschedule();
          },
        });
      } else {
        await runReschedule();
      }
    } catch (e: unknown) {
      showError("Error", getErrMsg(e));
    }
  }, [
    booking,
    bookingId,
    rescheduleDate,
    selectedSlot,
    rescheduleIntent,
    rescheduleBooking,
    setAlertConfig,
    setIsVisible,
    showError,
  ]);

  const requestCancelBooking = useCallback(() => {
    if (!booking) return;
    setAlertConfig({
      isVisible: true,
      title: "Cancel appointment",
      message: `Cancel ${booking.booking_reference} for ${booking.client_name}? This may process refunds per policy.`,
      type: "warning",
      confirmLabel: "Cancel appointment",
      onClose: () => setIsVisible(false),
      onConfirm: () => {
        void (async () => {
          try {
            await cancelSupportBooking({
              bookingId,
              booking_reference: booking.booking_reference,
            }).unwrap();
            setAlertConfig({
              isVisible: true,
              title: "Cancelled",
              message: "The booking was cancelled and the client was notified.",
              type: "success",
              confirmLabel: "OK",
              onConfirm: () => {
                setIsVisible(false);
                router.back();
              },
            });
          } catch (e: unknown) {
            showError("Error", getErrMsg(e));
          }
        })();
      },
    });
  }, [
    booking,
    bookingId,
    cancelSupportBooking,
    router,
    setAlertConfig,
    setIsVisible,
    showError,
  ]);

  const onEditDetails = useCallback(() => {
    setAlertConfig({
      isVisible: true,
      title: "Update booking",
      message:
        "Editing service type, valet package, add-ons, or address from the support app is not available yet.",
      type: "warning",
      confirmLabel: "OK",
      onConfirm: () => setIsVisible(false),
    });
  }, [setAlertConfig, setIsVisible]);

  const requestResendGuestEmail = useCallback(() => {
    if (!booking?.is_guest) return;
    setAlertConfig({
      isVisible: true,
      title: "Resend guest portal email",
      message: `Send a fresh results link to ${booking.client_email}? Previous links for this booking will stop working.`,
      type: "warning",
      confirmLabel: "Send email",
      onConfirm: () => {
        setIsVisible(false);
        void (async () => {
          try {
            const result = await resendGuestResultsEmail(bookingId).unwrap();
            setAlertConfig({
              isVisible: true,
              title: "Email queued",
              message: result.message || "Guest portal email queued.",
              type: "success",
              confirmLabel: "OK",
              onConfirm: () => setIsVisible(false),
            });
            refetch();
          } catch (e: unknown) {
            showError("Error", getErrMsg(e));
          }
        })();
      },
    });
  }, [
    booking,
    bookingId,
    refetch,
    resendGuestResultsEmail,
    setAlertConfig,
    setIsVisible,
    showError,
  ]);

  const imageTabs = useMemo(
    () =>
      [
        { id: "before-interior" as const, label: "Before - Interior" },
        { id: "after-interior" as const, label: "After - Interior" },
        { id: "before-exterior" as const, label: "Before - Exterior" },
        { id: "after-exterior" as const, label: "After - Exterior" },
      ] as const,
    []
  );

  const canModify = !!(booking && !["cancelled", "completed"].includes(booking.status));
  const showImageAction = booking?.status === "completed";

  const rescheduleBusy = slotsLoading || intentLoading || rescheduleSubmitting;

  return {
    slotsLoading,
    booking,
    isLoading,
    isError,
    refetch,
    bookingId,
    showImagesModal,
    setShowImagesModal,
    activeImageTab,
    setActiveImageTab,
    imageTabs,
    getTabImages,
    openCall,
    openEmail,
    openMaps,
    canModify,
    showImageAction,
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
    intentLoading,
    rescheduleSubmitting,
    cancelLoading,
    requestCancelBooking,
    onEditDetails,
    requestResendGuestEmail,
    resendGuestEmailLoading,
  };
}
