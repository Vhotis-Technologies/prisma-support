import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import ModalServices from "@/app/components/helpers/ModalServices";
import AllowNotificationModal from "@/app/components/notification/AllowNotificationModal";
import BookingItem from "@/app/components/bookings/BookingItem";
import DashboardDataCardComponent from "@/app/components/dashboard/DashboardDataCardComponent";
import DashboardGreeting from "@/app/components/dashboard/DashboardGreeting";
import DashboardQuickActions from "@/app/components/dashboard/DashboardQuickActions";
import DashboardSectionHeader from "@/app/components/dashboard/DashboardSectionHeader";
import StyledText from "@/app/components/helpers/StyledText";
import TicketItem from "@/app/components/tickets/TicketItem";
import {
  DASHBOARD_TIMEFRAME_OPTIONS,
  useDashboardFlow,
} from "@/app/app_hooks/useDashboardFlow";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function DashboardScreen() {
  const {
    timeframe,
    onSelectTimeframe,
    metrics,
    meta,
    isLoading,
    isFetching,
    isError,
    showNotificationModal,
    closeNotificationModal,
    onNotificationPermissionGranted,
    bookingsListData,
    bookingsListLoading,
    bookingsListError,
    bookingsPreview,
    attentionTickets,
    onTicketPress,
    onBookingPress,
    goTickets,
    goBookings,
  } = useDashboardFlow();

  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "borders");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );

  return (
    <View style={{ flex: 1, backgroundColor: backgroundColor }}>
      <ModalServices
        visible={showNotificationModal}
        onClose={closeNotificationModal}
        component={
          <AllowNotificationModal
            onClose={closeNotificationModal}
            onPermissionGranted={onNotificationPermissionGranted}
          />
        }
        showCloseButton={false}
        animationType="fade"
        modalType="fullscreen"
      />
      <ScrollView
        contentContainerStyle={styles.mainContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timeframeRow}>
          {DASHBOARD_TIMEFRAME_OPTIONS.map(({ value, label }) => {
            const selected = timeframe === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelectTimeframe(value)}
                style={[
                  styles.timeframeChip,
                  {
                    borderColor,
                    backgroundColor: selected ? tintColor : "transparent",
                  },
                ]}
              >
                <StyledText
                  variant="labelMedium"
                  color={selected ? "#FFFFFF" : textMuted}
                >
                  {label}
                </StyledText>
              </Pressable>
            );
          })}
        </View>

        {meta ? (
          <View style={styles.lookbackHint}>
            <StyledText variant="bodySmall" color={textMuted}>
              Values are totals in the last {meta.window_days} day
              {meta.window_days === 1 ? "" : "s"}; % vs. the prior{" "}
              {meta.window_days}-day period (client API
              {isFetching ? ", refreshing…" : ""}).
            </StyledText>
          </View>
        ) : null}

        <View style={styles.dataCardsContainer}>
          {isLoading && metrics.length === 0 ? (
            <View style={styles.metricsPlaceholder}>
              <StyledText variant="bodyMedium" color={textMuted}>
                Loading dashboard metrics…
              </StyledText>
            </View>
          ) : isError ? (
            <View style={styles.metricsPlaceholder}>
              <StyledText variant="bodyMedium" color={textMuted}>
                Could not load metrics. Check CLIENT_API_URL and
                SUPPORT_INTERNAL_API_KEY on the support server.
              </StyledText>
            </View>
          ) : (
            metrics.map((m) => (
              <View key={m.label} style={styles.cardWrapper}>
                <DashboardDataCardComponent
                  title={m.label}
                  value={m.value}
                  difference={m.difference}
                  isIncrease={m.isIncrease}
                  icon={m.icon}
                />
              </View>
            ))
          )}
        </View>

        <View style={styles.belowMetrics}>
          {/* TODO: Add a welcome message based on the user's role */}
          <DashboardGreeting />
          <DashboardQuickActions />

          <View style={styles.section}>
            <DashboardSectionHeader
              title="Needs attention"
              actionLabel="See all"
              onActionPress={goTickets}
            />
            {attentionTickets.length === 0 ? (
              <View style={styles.emptyTickets}>
                <StyledText variant="titleMedium">No open tickets</StyledText>
                <StyledText variant="bodyMedium" color={textMuted}>
                  There are no support tickets that need attention right now.
                </StyledText>
              </View>
            ) : (
              <View style={styles.previewList}>
                {attentionTickets.map((ticket) => (
                  <TicketItem
                    key={ticket.id}
                    ticket={ticket}
                    onPress={onTicketPress}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <DashboardSectionHeader
              title="Upcoming bookings"
              actionLabel="See all"
              onActionPress={goBookings}
            />
            {bookingsListLoading && bookingsListData === undefined ? (
              <View style={styles.emptyTickets}>
                <StyledText variant="bodyMedium" color={textMuted}>
                  Loading bookings…
                </StyledText>
              </View>
            ) : bookingsListError ? (
              <View style={styles.emptyTickets}>
                <StyledText variant="bodyMedium" color={textMuted}>
                  Could not load bookings.
                </StyledText>
              </View>
            ) : bookingsPreview.length === 0 ? (
              <View style={styles.emptyTickets}>
                <StyledText variant="titleMedium">No upcoming confirmed bookings</StyledText>
                <StyledText variant="bodyMedium" color={textMuted}>
                  Confirmed visits due soon, in progress, or from the last 12 hours will
                  appear here.
                </StyledText>
              </View>
            ) : (
              <View style={styles.previewList}>
                {bookingsPreview.map((booking) => (
                  <BookingItem
                    key={booking.id}
                    booking={booking}
                    onPress={onBookingPress}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    paddingHorizontal: 5,
    paddingTop: 5,
    paddingBottom: 24,
  },
  timeframeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  timeframeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  lookbackHint: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  dataCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 5,
  },
  cardWrapper: {
    width: "49.5%",
  },
  metricsPlaceholder: {
    width: "100%",
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  belowMetrics: {
    marginTop: 20,
    gap: 20,
    paddingHorizontal: 4,
  },
  section: {
    marginBottom: 4,
  },
  previewList: {
    gap: 4,
  },
  emptyTickets: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
});
