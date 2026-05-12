import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyledText from "@/app/components/helpers/StyledText";
import type {
  BookingDetails,
  BookingStatus,
  PaymentStatus,
} from "@/app/interfaces/BookingInterface";
import BookingImageGalleryTab from "@/app/components/bookings/BookingImageGalleryTab";
import ModalServices from "@/app/components/helpers/ModalServices";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";
import { useBookingFlow } from "@/app/app_hooks/useBookingFlow";

function statusLabel(status: BookingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function paymentLabel(p: PaymentStatus): string {
  switch (p) {
    case "invoice later":
      return "Invoice pending";
    case "paid":
      return "Paid";
    case "unpaid":
      return "Unpaid";
    case "partial":
      return "Partial";
    case "refunded":
      return "Refunded";
    default:
      return String(p).charAt(0).toUpperCase() + String(p).slice(1);
  }
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatAddressLine(booking: BookingDetails): string {
  const { address, city, postcode, country } = booking.address;
  return [address, city, postcode, country].filter(Boolean).join(", ");
}



function statusBadgeColor(
  status: BookingStatus,
  c: { warning: string; primary: string; error: string; success: string }
): string {
  switch (status) {
    case "pending":
      return c.warning;
    case "confirmed":
      return c.primary;
    case "cancelled":
      return c.error;
    case "completed":
      return c.success;
    default:
      return c.primary;
  }
}

export default function BookingDetailsScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const bookingId = typeof idParam === "string" ? idParam : idParam?.[0] ?? "";
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const textColor = useThemeColor({}, "text");
  const primary = useThemeColor({}, "primary");
  const error = useThemeColor({}, "error");
  const success = useThemeColor({}, "success");
  const warning = useThemeColor({}, "warning");
  const tint = useThemeColor({}, "tint");

  const flow = useBookingFlow(bookingId);
  const {
    booking,
    isLoading,
    isError,
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
    slotsLoading,
    intentLoading,
    rescheduleSubmitting,
    cancelLoading,
    requestCancelBooking,
    onEditDetails,
  } = flow;

  const badgeColor = booking
    ? statusBadgeColor(booking.status, { warning, primary, error, success })
    : primary;

  if (!bookingId) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={48} color={muted} />
        <StyledText variant="titleLarge" style={styles.emptyTitle}>
          Booking not found
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This link may be invalid or the booking was removed.
        </StyledText>
      </View>
    );
  }

  if (isLoading && !booking) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted} style={{ marginTop: 16 }}>
          Loading booking…
        </StyledText>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={48} color={muted} />
        <StyledText variant="titleLarge" style={styles.emptyTitle}>
          Booking not found
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This link may be invalid, or the booking was removed. Check your connection
          and API configuration.
        </StyledText>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={[styles.scroll, { backgroundColor }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 24) + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary */}
      <View style={[styles.hero, { borderColor }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroTitles}>
            <StyledText variant="labelSmall" color={muted}>
              Reference
            </StyledText>
            <StyledText variant="titleSmall" style={styles.ref}>
              {booking.booking_reference}
            </StyledText>
            <StyledText variant="titleSmall" style={{ fontFamily: "BarlowMedium" }}>
              {booking.service_type}
            </StyledText>
            <StyledText variant="bodySmall" color={muted}>
              {booking.valet_type}
            </StyledText>
          </View>
          <View style={styles.heroRight}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: `${badgeColor}18`,
                  borderColor: badgeColor,
                },
              ]}
            >
              <StyledText
                variant="labelMedium"
                style={{ color: badgeColor, fontFamily: "BarlowMedium" }}
              >
                {statusLabel(booking.status)}
              </StyledText>
            </View>
            {booking.is_express_service ? (
              <View
                style={[
                  styles.expressPill,
                  { borderColor: tint, backgroundColor: `${tint}14` },
                ]}
              >
                <Ionicons name="flash-outline" size={14} color={tint} />
                <StyledText
                  variant="labelSmall"
                  style={{ color: tint, fontFamily: "BarlowMedium" }}
                >
                  Express
                </StyledText>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.heroFooter}>
          <StyledText variant="labelSmall" color={muted}>
            Total
          </StyledText>
          <StyledText variant="titleMedium" style={{ fontFamily: "BarlowMedium" }}>
            {formatCurrency(booking.total_amount)}
          </StyledText>
        </View>
      </View>

      {/* Quick actions */}
      {canModify ? (
        <View style={styles.actionsRow}>
          <Pressable
            onPress={openReschedule}
            style={({ pressed }) => [
              styles.actionPrimary,
              { borderColor: primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="calendar-outline" size={20} color={primary} />
            <StyledText
              variant="labelLarge"
              style={{ color: primary, fontFamily: "BarlowMedium" }}
            >
              Reschedule
            </StyledText>
          </Pressable>
          <Pressable
            onPress={onEditDetails}
            style={({ pressed }) => [
              styles.actionSecondary,
              { borderColor, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="create-outline" size={20} color={iconColor} />
            <StyledText variant="labelLarge" style={{ fontFamily: "BarlowMedium" }}>
              Edit details
            </StyledText>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.banner, { borderColor, backgroundColor: `${muted}12` }]}>
          <Ionicons name="information-circle-outline" size={22} color={tint} />
          <StyledText variant="bodySmall" style={styles.bannerText}>
            This booking is {statusLabel(booking.status).toLowerCase()}. Reschedule
            and cancel actions are disabled.
          </StyledText>
        </View>
      )}

      <View style={styles.singleActionWrap}>
        {canModify ? (
          <Pressable
            onPress={requestCancelBooking}
            disabled={cancelLoading}
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: error, opacity: pressed ? 0.88 : cancelLoading ? 0.5 : 1 },
            ]}
          >
            {cancelLoading ? (
              <ActivityIndicator color={error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={22} color={error} />
                <StyledText
                  variant="labelLarge"
                  style={{ color: error, fontFamily: "BarlowMedium" }}
                >
                  Cancel appointment
                </StyledText>
              </>
            )}
          </Pressable>
        ) : null}
        {showImageAction ? (
          <Pressable
            onPress={() => setShowImagesModal(true)}
            style={({ pressed }) => [
              styles.imagesBtn,
              { borderColor: primary, opacity: pressed ? 0.88 : 1 },
            ]}
          >
            <Ionicons name="images-outline" size={20} color={primary} />
            <StyledText
              variant="labelLarge"
              style={{ color: primary, fontFamily: "BarlowMedium" }}
            >
              View booking images
            </StyledText>
          </Pressable>
        ) : null}
      </View>

      <Section title="Client" icon="person-outline" borderColor={borderColor}>
        <DetailRow label="Name" value={booking.client_name} muted={muted} />
        <DetailRow label="Type" value={booking.client_type} muted={muted} />
        <PressableRow
          label="Email"
          value={booking.client_email}
          muted={muted}
          icon="mail-outline"
          onPress={() => openEmail(booking.client_email)}
        />
        <PressableRow
          label="Phone"
          value={booking.client_phone}
          muted={muted}
          icon="call-outline"
          onPress={() => openCall(booking.client_phone)}
        />
      </Section>

      <Section title="Appointment" icon="calendar-outline" borderColor={borderColor}>
        <DetailRow label="Date & time" value={booking.appointment_date} muted={muted} />
        <DetailRow label="Duration" value={`${booking.duration_minutes} minutes`} muted={muted} />
        <DetailRow label="Booked on" value={booking.booking_date} muted={muted} />
        <DetailRow
          label="Payment"
          value={paymentLabel(booking.payment_status)}
          muted={muted}
        />
      </Section>

      <Section title="Location" icon="location-outline" borderColor={borderColor}>
        <DetailRow label="Address" value={formatAddressLine(booking)} muted={muted} />
        <Pressable
          onPress={() => openMaps(booking)}
          style={({ pressed }) => [
            styles.mapsBtn,
            { borderColor: primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="map-outline" size={18} color={primary} />
          <StyledText variant="labelLarge" style={{ color: primary, fontFamily: "BarlowMedium" }}>
            Open in Maps
          </StyledText>
        </Pressable>
      </Section>

      <Section title="Service" icon="car-outline" borderColor={borderColor}>
        <DetailRow label="Service type" value={booking.service_type} muted={muted} />
        <DetailRow label="Valet package" value={booking.valet_type} muted={muted} />
        {booking.service_description ? (
          <>
            <StyledText variant="labelMedium" color={muted} style={styles.blockLabel}>
              Description
            </StyledText>
            <StyledText variant="bodyMedium" style={styles.block}>
              {booking.service_description}
            </StyledText>
          </>
        ) : null}
      </Section>

      <Section title="Customer review" icon="chatbox-ellipses-outline" borderColor={borderColor}>
        {booking.is_reviewed ? (
          <>
            <DetailRow
              label="Rating"
              value={
                booking.review_rating != null
                  ? `${booking.review_rating} / 5`
                  : "—"
              }
              muted={muted}
            />
            {booking.review_submitted_at ? (
              <DetailRow
                label="Submitted"
                value={booking.review_submitted_at.replace("T", " ").slice(0, 19)}
                muted={muted}
              />
            ) : null}
            {booking.review_comment ? (
              <>
                <StyledText variant="labelMedium" color={muted} style={styles.blockLabel}>
                  Comment
                </StyledText>
                <StyledText variant="bodyMedium" style={styles.block}>
                  {booking.review_comment}
                </StyledText>
              </>
            ) : (
              <StyledText variant="bodyMedium" color={muted}>
                No written comment with this review.
              </StyledText>
            )}
          </>
        ) : (
          <StyledText variant="bodyMedium" color={muted}>
            No review submitted yet.
          </StyledText>
        )}
      </Section>

      <Section title="Add-ons" icon="add-circle-outline" borderColor={borderColor}>
        {booking.addons.length === 0 ? (
          <StyledText variant="bodyMedium" color={muted}>
            No add-ons on this booking.
          </StyledText>
        ) : (
          booking.addons.map((addon) => (
            <View key={addon} style={styles.addonRow}>
              <Ionicons name="checkmark-circle" size={18} color={success} />
              <StyledText variant="bodyMedium" style={styles.addonText}>
                {addon}
              </StyledText>
            </View>
          ))
        )}
      </Section>

      <Section title="Loyalty" icon="ribbon-outline" borderColor={borderColor}>
        <DetailRow label="Tier" value={booking.loyalty_tier} muted={muted} />
        <StyledText variant="labelMedium" color={muted} style={styles.blockLabel}>
          Active benefits
        </StyledText>
        {booking.loyalty_benefits.length === 0 ? (
          <StyledText variant="bodyMedium" color={muted}>
            None listed.
          </StyledText>
        ) : (
          booking.loyalty_benefits.map((b) => (
            <View key={b} style={styles.addonRow}>
              <Ionicons name="star-outline" size={16} color={tint} />
              <StyledText variant="bodyMedium" style={styles.addonText}>
                {b}
              </StyledText>
            </View>
          ))
        )}
      </Section>

      <Section title="Assigned team" icon="people-outline" borderColor={borderColor}>
        {booking.team_members.length === 0 ? (
          <StyledText variant="bodyMedium" color={muted}>
            No team assigned yet.
          </StyledText>
        ) : (
          booking.team_members.map((m) => (
            <View key={m.id} style={styles.teamCard}>
              <View style={styles.teamRow}>
                <View style={[styles.avatar, { backgroundColor: `${primary}22` }]}>
                  <StyledText variant="labelLarge" style={{ color: primary }}>
                    {initials(m.name)}
                  </StyledText>
                </View>
                <View style={styles.teamText}>
                  <StyledText variant="titleSmall" style={{ fontFamily: "BarlowMedium" }}>
                    {m.name}
                  </StyledText>
                  <StyledText variant="bodySmall" color={muted}>
                    {m.role}
                  </StyledText>
                </View>
              </View>
              <View style={styles.teamActions}>
                <Pressable
                  onPress={() => openCall(m.phone)}
                  style={({ pressed }) => [
                    styles.teamChip,
                    { borderColor, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="call-outline" size={16} color={primary} />
                  <StyledText variant="labelSmall" style={{ color: primary }}>
                    Call
                  </StyledText>
                </Pressable>
                <Pressable
                  onPress={() => openEmail(m.email)}
                  style={({ pressed }) => [
                    styles.teamChip,
                    { borderColor, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Ionicons name="mail-outline" size={16} color={primary} />
                  <StyledText variant="labelSmall" style={{ color: primary }}>
                    Email
                  </StyledText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="Special instructions" icon="document-text-outline" borderColor={borderColor}>
        <StyledText variant="bodyMedium" style={styles.block}>
          {booking.special_instructions?.trim() ? booking.special_instructions : "—"}
        </StyledText>
      </Section>
    </ScrollView>

    <Modal
      visible={rescheduleVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setRescheduleVisible(false)}
    >
      <Pressable
        style={styles.rescheduleBackdrop}
        onPress={() => setRescheduleVisible(false)}
      >
        <Pressable
          style={[styles.rescheduleCard, { backgroundColor: cardBg, borderColor }]}
          onPress={(e) => e.stopPropagation()}
        >
          <StyledText variant="titleMedium" style={styles.rescheduleTitle}>
            Reschedule appointment
          </StyledText>
          <StyledText variant="bodySmall" color={muted} style={styles.rescheduleHint}>
            Date (YYYY-MM-DD), then load slots from detailer availability.
          </StyledText>
          <TextInput
            value={rescheduleDate}
            onChangeText={setRescheduleDate}
            placeholder="2025-03-20"
            placeholderTextColor={muted}
            editable={!rescheduleBusy}
            style={[
              styles.rescheduleInput,
              { borderColor, color: textColor, fontFamily: "BarlowRegular" },
            ]}
          />
          <Pressable
            onPress={() => void loadRescheduleSlots()}
            disabled={rescheduleBusy}
            style={({ pressed }) => [
              styles.rescheduleLoadBtn,
              { borderColor: primary, opacity: pressed ? 0.85 : rescheduleBusy ? 0.5 : 1 },
            ]}
          >
            {slotsLoading ? (
              <ActivityIndicator color={primary} />
            ) : (
              <StyledText variant="labelLarge" style={{ color: primary, fontFamily: "BarlowMedium" }}>
                Load available times
              </StyledText>
            )}
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.slotRow}
            contentContainerStyle={styles.slotRowContent}
          >
            {rescheduleSlots.map((slot) => {
              const sel = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  onPress={() => setSelectedSlot(slot)}
                  style={[
                    styles.slotChip,
                    {
                      borderColor: sel ? primary : borderColor,
                      backgroundColor: sel ? `${primary}18` : "transparent",
                    },
                  ]}
                >
                  <StyledText
                    variant="labelMedium"
                    style={{ color: sel ? primary : textColor, fontFamily: "BarlowMedium" }}
                  >
                    {slot}
                  </StyledText>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.rescheduleActions}>
            <Pressable
              onPress={() => setRescheduleVisible(false)}
              style={({ pressed }) => [styles.rescheduleSecondary, { borderColor, opacity: pressed ? 0.8 : 1 }]}
            >
              <StyledText variant="labelLarge" style={{ fontFamily: "BarlowMedium" }}>
                Close
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => void confirmReschedule()}
              disabled={rescheduleBusy}
              style={({ pressed }) => [
                styles.reschedulePrimary,
                { backgroundColor: primary, opacity: pressed ? 0.9 : rescheduleBusy ? 0.5 : 1 },
              ]}
            >
              {rescheduleSubmitting || intentLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <StyledText variant="labelLarge" style={{ color: "#FFFFFF", fontFamily: "BarlowMedium" }}>
                  Confirm reschedule
                </StyledText>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>

    <ModalServices
      visible={showImagesModal}
      onClose={() => setShowImagesModal(false)}
      modalType="fullscreen"
      animationType="slide"
      title={`Booking images · ${booking.booking_reference}`}
      showCloseButton
      component={
        <View style={styles.bookingImagesModalBody}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            style={[styles.bookingImagesTabsScroll, { borderBottomColor: borderColor }]}
            contentContainerStyle={styles.bookingImagesTabsContent}
          >
            {imageTabs.map((tab) => {
              const isActive = activeImageTab === tab.id;
              const tabImages = getTabImages(tab.id);
              const hasImages = tabImages.length > 0;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveImageTab(tab.id)}
                  activeOpacity={0.6}
                  style={[
                    styles.bookingImagesTab,
                    {
                      backgroundColor: isActive ? primary : "transparent",
                      borderColor: isActive ? primary : borderColor,
                      borderWidth: 1.5,
                    },
                    isActive && styles.bookingImagesTabActive,
                  ]}
                >
                  <StyledText
                    variant="labelSmall"
                    style={[
                      styles.bookingImagesTabLabel,
                      {
                        color: isActive ? "#FFFFFF" : textColor,
                      },
                      isActive && styles.bookingImagesTabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </StyledText>
                  {hasImages ? (
                    <View
                      style={[
                        styles.bookingImagesTabBadge,
                        {
                          backgroundColor: isActive
                            ? "rgba(255,255,255,0.35)"
                            : primary,
                        },
                      ]}
                    >
                      <StyledText variant="bodySmall" style={styles.bookingImagesTabBadgeText}>
                        {tabImages.length}
                      </StyledText>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.bookingImagesTabPane}>
            <BookingImageGalleryTab
              images={getTabImages(activeImageTab)}
              bookingReference={booking.booking_reference}
            />
          </View>
        </View>
      }
    />
    </>
  );
}

function Section({
  title,
  icon,
  borderColor,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  borderColor: string;
  children: React.ReactNode;
}) {
  const cardBg = useThemeColor({}, "cards");
  const iconColor = useThemeColor({}, "icons");
  return (
    <View style={[styles.section, { borderColor }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <StyledText variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </StyledText>
      </View>
      {children}
    </View>
  );
}

function DetailRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted: string;
}) {
  return (
    <View style={styles.detailRow}>
      <StyledText variant="labelMedium" color={muted} style={styles.detailLabel}>
        {label}
      </StyledText>
      <StyledText variant="bodyMedium" style={styles.detailValue}>
        {value}
      </StyledText>
    </View>
  );
}

function PressableRow({
  label,
  value,
  muted,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  muted: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const primary = useThemeColor({}, "primary");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressableRow, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={styles.pressableRowInner}>
        <StyledText variant="labelMedium" color={muted} style={styles.detailLabel}>
          {label}
        </StyledText>
        <StyledText
          variant="bodyMedium"
          style={[styles.detailValue, { color: primary }]}
          numberOfLines={2}
        >
          {value}
        </StyledText>
      </View>
      <Ionicons name={icon} size={18} color={primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 4,
    paddingTop: 2,
    gap: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 12,
    fontFamily: "BarlowMedium",
  },
  hero: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 12,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  heroTitles: {
    flex: 1,
    gap: 4,
  },
  ref: {
    fontFamily: "BarlowMedium",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
    borderBottomWidth: 0.2,
  },
  heroRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  expressPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 2,
    borderBottomWidth: 0.2,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 2,
    borderBottomWidth: 0.2,
  },
  blockLabel: {
    marginTop: 8,
    marginBottom: 4,
  },
  addonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  addonText: {
    flex: 1,
    fontFamily: "BarlowRegular",
  },
  teamCard: {
    gap: 10,
    paddingVertical: 10,
  },
  teamActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingLeft: 56,
  },
  teamChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  actionSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  imagesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  singleActionWrap: {
    gap: 10,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    lineHeight: 20,
  },
  section: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: "BarlowMedium",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 6,
  },
  detailLabel: {
    width: 110,
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    fontFamily: "BarlowRegular",
  },
  pressableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 10,
  },
  pressableRowInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  block: {
    lineHeight: 22,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  teamText: {
    flex: 1,
    gap: 2,
  },
  bookingImagesModalBody: {
    flex: 1,
    minHeight: 280,
  },
  /** Fixed height so tabs are not stretched by parent ModalServices ScrollView */
  bookingImagesTabsScroll: {
    borderBottomWidth: 1,
    maxHeight: 50,
    paddingVertical: 8,
  },
  bookingImagesTabsContent: {
    paddingHorizontal: 5,
    alignItems: "center",
    flexDirection: "row",
  },
  bookingImagesTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    minWidth: 130,
  },
  bookingImagesTabActive: {
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  bookingImagesTabLabel: {
    fontWeight: "500",
    fontSize: 12,
  },
  bookingImagesTabLabelActive: {
    fontWeight: "600",
  },
  bookingImagesTabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bookingImagesTabBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  bookingImagesTabPane: {
    flex: 1,
    minHeight: 200,
    paddingHorizontal: 2,
  },
  rescheduleBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  rescheduleCard: {
    borderRadius: 2,
    borderBottomWidth: 0.2,
    padding: 12,
    gap: 12,
  },
  rescheduleTitle: {
    fontFamily: "BarlowMedium",
  },
  rescheduleHint: {
    marginBottom: 4,
  },
  rescheduleInput: {
    borderBottomWidth: 0.2,
    borderRadius: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  rescheduleLoadBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 2,
    borderBottomWidth: 0.2,
  },
  slotRow: {
    maxHeight: 48,
  },
  slotRowContent: {
    gap: 8,
    alignItems: "center",
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  rescheduleActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  rescheduleSecondary: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 2,
    borderBottomWidth: 0.2,
  },
  reschedulePrimary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 2,
    borderBottomWidth: 0.2,
  },
});
