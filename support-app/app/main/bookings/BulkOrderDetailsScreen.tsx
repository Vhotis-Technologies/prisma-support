import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import BookingItem from "@/app/components/bookings/BookingItem";
import StyledText from "@/app/components/helpers/StyledText";
import type {
  AppointmentListItem,
  BookingDetails,
  BulkOrderDetailPayload,
  BulkOrderPaymentSummary,
  SupportBookingListRow,
} from "@/app/interfaces/BookingInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";
import { useBulkOrderSupportFlow } from "@/app/app_hooks/useBulkOrderSupportFlow";

function paymentLabel(raw: string): string {
  if (!raw) return "";
  switch (raw) {
    case "invoice_later":
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
      return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
}

function toListRows(appointments: BookingDetails[]): SupportBookingListRow[] {
  return appointments.map((a) =>
    a.kind === "appointment"
      ? (a as AppointmentListItem)
      : ({ kind: "appointment" as const, ...a } as AppointmentListItem)
  );
}

type HeaderProps = {
  bulk: BulkOrderDetailPayload;
  pay: BulkOrderPaymentSummary;
  count: number;
  borderColor: string;
  muted: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  tint: string;
  canModify: boolean;
  cancelLoading: boolean;
  onReschedule: () => void;
  onCancelBulk: () => void;
};

function ListHeader({
  bulk,
  pay,
  count,
  borderColor,
  muted,
  primary,
  success,
  warning,
  error,
  tint,
  canModify,
  cancelLoading,
  onReschedule,
  onCancelBulk,
}: HeaderProps) {
  const payTint =
    pay.payment_status === "paid"
      ? success
      : pay.payment_status === "partial" || pay.payment_status === "invoice_later"
        ? warning
        : muted;

  return (
    <View style={styles.headerBlock}>
      <View style={[styles.hero, { borderColor }]}>
        <View style={styles.heroRow}>
          <Ionicons name="layers-outline" size={28} color={primary} />
          <View style={styles.heroText}>
            <StyledText variant="labelSmall" color={muted}>
              Reference
            </StyledText>
            <StyledText variant="titleSmall" style={{ fontFamily: "BarlowMedium" }}>
              {bulk.booking_reference}
            </StyledText>
            <StyledText variant="bodyMedium" style={{ marginTop: 4 }}>
              {bulk.client_name}
            </StyledText>
            <StyledText variant="bodySmall" color={muted}>
              {bulk.client_email}
            </StyledText>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <StyledText variant="labelSmall" color={muted}>
              Vehicles
            </StyledText>
            <StyledText variant="titleMedium" style={{ fontFamily: "BarlowMedium" }}>
              {bulk.number_of_vehicles}
            </StyledText>
          </View>
          <View style={styles.stat}>
            <StyledText variant="labelSmall" color={muted}>
              Order total
            </StyledText>
            <StyledText variant="titleMedium" style={{ fontFamily: "BarlowMedium" }}>
              {formatCurrency(bulk.total_amount)}
            </StyledText>
          </View>
          <View style={styles.stat}>
            <StyledText variant="labelSmall" color={muted}>
              Payment
            </StyledText>
            <StyledText variant="titleSmall" style={{ color: payTint, fontFamily: "BarlowMedium" }}>
              {paymentLabel(String(pay.payment_status))}
            </StyledText>
            <StyledText variant="labelSmall" color={muted}>
              Stripe: {bulk.payment_status}
            </StyledText>
          </View>
        </View>

        <StyledText variant="bodySmall" color={muted} style={{ marginTop: 8 }}>
          Paid in: {formatCurrency(pay.payments_total)} · Refunds:{" "}
          {formatCurrency(pay.refunds_total)}
        </StyledText>

        <StyledText variant="bodySmall" color={muted} style={{ marginTop: 12 }}>
          Cancel or reschedule the whole fleet bulk order here. Individual line appointments (BULK…-
          1, …) cannot use the standard appointment cancel flow.
        </StyledText>

        {canModify ? (
          <View style={styles.bulkActionsRow}>
            <Pressable
              onPress={onReschedule}
              style={({ pressed }) => [
                styles.bulkActionPrimary,
                { borderColor: primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color={primary} />
              <StyledText variant="labelLarge" style={{ color: primary, fontFamily: "BarlowMedium" }}>
                Reschedule bulk order
              </StyledText>
            </Pressable>
            <Pressable
              onPress={onCancelBulk}
              disabled={cancelLoading}
              style={({ pressed }) => [
                styles.bulkCancelBtn,
                { borderColor: error, opacity: pressed ? 0.88 : cancelLoading ? 0.5 : 1 },
              ]}
            >
              {cancelLoading ? (
                <ActivityIndicator color={error} />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={22} color={error} />
                  <StyledText variant="labelLarge" style={{ color: error, fontFamily: "BarlowMedium" }}>
                    Cancel bulk order
                  </StyledText>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={[styles.banner, { borderColor, backgroundColor: `${muted}12` }]}>
            <Ionicons name="information-circle-outline" size={22} color={tint} />
            <StyledText variant="bodySmall" style={styles.bannerText}>
              This bulk order cannot be rescheduled or cancelled from here (completed, cancelled, or
              all lines finished).
            </StyledText>
          </View>
        )}
      </View>

      <StyledText variant="titleSmall" style={styles.sectionTitle}>
        Appointments ({count})
      </StyledText>
    </View>
  );
}

export default function BulkOrderDetailsScreen() {
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const bulkOrderId = typeof idParam === "string" ? idParam : idParam?.[0] ?? "";
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const success = useThemeColor({}, "success");
  const warning = useThemeColor({}, "warning");
  const textColor = useThemeColor({}, "text");
  const error = useThemeColor({}, "error");
  const tint = useThemeColor({}, "tint");

  const flow = useBulkOrderSupportFlow(bulkOrderId);
  const {
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
  } = flow;

  const listRows = useMemo(
    () => (data?.appointments?.length ? toListRows(data.appointments) : []),
    [data?.appointments]
  );

  const onAppointmentPress = useCallback(
    (row: SupportBookingListRow) => {
      if (row.kind !== "appointment") return;
      router.push({
        pathname: "/main/bookings/BookingDetailsScreen",
        params: { id: row.id },
      } as Href);
    },
    [router]
  );

  const renderItem: ListRenderItem<SupportBookingListRow> = useCallback(
    ({ item }) => <BookingItem booking={item} onPress={onAppointmentPress} />,
    [onAppointmentPress]
  );

  const keyExtractor = useCallback((item: SupportBookingListRow) => item.id, []);

  const listHeader = useMemo(() => {
    if (!data) return null;
    return (
      <ListHeader
        bulk={data.bulk_order}
        pay={data.payment_summary}
        count={listRows.length}
        borderColor={borderColor}
        muted={muted}
        primary={primary}
        success={success}
        warning={warning}
        error={error}
        tint={tint}
        canModify={canModify}
        cancelLoading={cancelLoading}
        onReschedule={openReschedule}
        onCancelBulk={requestCancelBulkOrder}
      />
    );
  }, [
    data,
    listRows.length,
    borderColor,
    muted,
    primary,
    success,
    warning,
    error,
    tint,
    canModify,
    cancelLoading,
    openReschedule,
    requestCancelBulkOrder,
  ]);

  if (!bulkOrderId) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <StyledText variant="titleMedium">Invalid bulk order</StyledText>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted} style={{ marginTop: 16 }}>
          Loading bulk order…
        </StyledText>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={48} color={muted} />
        <StyledText variant="titleMedium" style={{ marginTop: 12 }}>
          Could not load bulk order
        </StyledText>
        <StyledText variant="bodyMedium" color={muted} style={{ marginTop: 8 }}>
          Check your connection and API configuration.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <FlatList
        data={listRows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            {listHeader}
            <View style={styles.listHeaderSpacer} />
          </View>
        }
        refreshing={isFetching && listRows.length > 0}
        onRefresh={refetch}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
        showsVerticalScrollIndicator={false}
      />

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
              Reschedule bulk order
            </StyledText>
            <StyledText variant="bodySmall" color={muted} style={styles.rescheduleHint}>
              New date (YYYY-MM-DD), then load times. All vehicles move together (same rules as the
              client fleet flow; not within 12h of job start).
            </StyledText>
            <TextInput
              value={rescheduleDate}
              onChangeText={setRescheduleDate}
              placeholder="2026-04-20"
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
                style={({ pressed }) => [
                  styles.rescheduleSecondary,
                  { borderColor, opacity: pressed ? 0.8 : 1 },
                ]}
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
                {rescheduleSubmitting ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 14,
  },
  listHeaderSpacer: {
    height: 8,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  heroRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  heroText: {
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 16,
  },
  stat: {
    minWidth: "28%",
  },
  sectionTitle: {
    marginBottom: 8,
    fontFamily: "BarlowMedium",
  },
  listContent: {
    paddingHorizontal: 2,
    flexGrow: 1,
  },
  bulkActionsRow: {
    marginTop: 16,
    gap: 12,
  },
  bulkActionPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  bulkCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  banner: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
  },
  rescheduleBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  rescheduleCard: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28,
    maxHeight: "88%",
  },
  rescheduleTitle: {
    marginBottom: 8,
    fontFamily: "BarlowMedium",
  },
  rescheduleHint: {
    marginBottom: 12,
  },
  rescheduleInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  rescheduleLoadBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  slotRow: {
    marginBottom: 12,
    maxHeight: 52,
  },
  slotRowContent: {
    gap: 8,
    paddingVertical: 4,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  rescheduleActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  rescheduleSecondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  reschedulePrimary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
});
