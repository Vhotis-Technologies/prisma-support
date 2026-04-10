import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { type Href, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActivityItem from "@/app/components/activities/ActivityItem";
import StyledText from "@/app/components/helpers/StyledText";
import type ActivityInterface from "@/app/interfaces/ActivityInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAppSelector } from "@/app/store/main_store";
import { useGetActivityFeedQuery } from "@/app/store/api/activityApi";

const POLL_MS = 30_000;

export default function ActivitiesScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const access = useAppSelector((s) => s.auth.access);
  const backgroundColor = useThemeColor({}, "background");
  const primary = useThemeColor({}, "primary");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text"
  );

  const { data, isLoading, isError, isFetching, refetch } = useGetActivityFeedQuery(
    undefined,
    {
      skip: !isFocused || !access,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      pollingInterval: isFocused && access ? POLL_MS : 0,
    }
  );

  const activities = data?.activities ?? [];

  const onActivityPress = useCallback(
    (activity: ActivityInterface) => {
      if (!activity.entity_id) return;
      const id = activity.entity_id;
      switch (activity.activity_type) {
        case "booking":
          router.push({
            pathname: "/main/bookings/BookingDetailsScreen",
            params: { id },
          } as Href);
          break;
        case "customer":
          router.push({
            pathname: "/main/customers/B2CDetailsScreen",
            params: { id },
          } as Href);
          break;
        case "fleet":
        case "subscription":
          router.push({
            pathname: "/main/customers/FleetDetailsScreen",
            params: { id },
          } as Href);
          break;
        case "partner":
        case "payout":
          router.push({
            pathname: "/main/customers/PartnerDetailsScreen",
            params: { id },
          } as Href);
          break;
        case "branch":
        case "fleet_vehicle":
          router.push({
            pathname: "/main/customers/FleetDetailsScreen",
            params: { id },
          } as Href);
          break;
        case "vehicle":
        case "transfer":
          router.push({
            pathname: "/main/customers/B2CDetailsScreen",
            params: { id },
          } as Href);
          break;
        default:
          break;
      }
    },
    [router]
  );

  const renderItem: ListRenderItem<ActivityInterface> = useCallback(
    ({ item }) => (
      <ActivityItem
        activity={item}
        onPress={
          item.entity_id && item.activity_type !== "detailer"
            ? onActivityPress
            : undefined
        }
      />
    ),
    [onActivityPress]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="bodyMedium" color={textMuted}>
          Recent changes across bookings, customers, fleets, and partners.
        </StyledText>
      </View>
    ),
    [textMuted]
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">No activity yet</StyledText>
        <StyledText variant="bodyMedium" color={textMuted} style={styles.emptySub}>
          {isError
            ? "Could not load activity. Check connection and API configuration."
            : "There are no recent events in the selected period."}
        </StyledText>
      </View>
    ),
    [isError, textMuted]
  );

  const errorBanner = useMemo(
    () =>
      isError ? (
        <View style={[styles.errorBanner, { borderColor: textMuted }]}>
          <StyledText variant="bodyMedium" color={textMuted}>
            Could not load activities. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY.
          </StyledText>
        </View>
      ) : null,
    [isError, textMuted]
  );

  if (isLoading && activities.length === 0) {
    return (
      <View style={[styles.container, styles.loading, { backgroundColor }]}>
        {errorBanner}
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {errorBanner}
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isFetching && activities.length > 0}
        onRefresh={refetch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 2,
    paddingTop: 8,
  },
  header: {
    marginBottom: 5,
    gap: 3,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
    paddingHorizontal: 16,
  },
  emptySub: {
    textAlign: "center",
  },
  loading: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
