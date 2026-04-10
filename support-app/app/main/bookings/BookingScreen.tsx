import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { type Href, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import BookingItem from "@/app/components/bookings/BookingItem";
import StyledText from "@/app/components/helpers/StyledText";
import type { SupportBookingListRow } from "@/app/interfaces/BookingInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAppSelector } from "@/app/store/main_store";
import { useGetSupportBookingsListQuery } from "@/app/store/api/bookingApi";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function rowMatchesSearch(row: SupportBookingListRow, q: string): boolean {
  if (!q) return true;
  const name = (row.client_name ?? "").toLowerCase();
  const ref = (row.booking_reference ?? "").toLowerCase();
  return name.includes(q) || ref.includes(q);
}

export default function BookingsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const access = useAppSelector((s) => s.auth.access);
  const backgroundColor = useThemeColor({}, "background");
  const primary = useThemeColor({}, "primary");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text"
  );

  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, isFetching, refetch } =
    useGetSupportBookingsListQuery(undefined, {
      skip: !isFocused || !access,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
    });

  const filteredBookings = useMemo(() => {
    const rows = data ?? [];
    const q = normalizeQuery(searchQuery);
    if (!q) return rows;
    return rows.filter((row) => rowMatchesSearch(row, q));
  }, [data, searchQuery]);

  const onBookingPress = useCallback(
    (row: SupportBookingListRow) => {
      if (row.kind === "bulk_order") {
        router.push({
          pathname: "/main/bookings/BulkOrderDetailsScreen",
          params: { id: row.bulk_order_id },
        } as Href);
        return;
      }
      router.push({
        pathname: "/main/bookings/BookingDetailsScreen",
        params: { id: row.id },
      } as Href);
    },
    [router]
  );

  const renderItem: ListRenderItem<SupportBookingListRow> = useCallback(
    ({ item }) => <BookingItem booking={item} onPress={onBookingPress} />,
    [onBookingPress]
  );

  const keyExtractor = useCallback((item: SupportBookingListRow) => item.id, []);

  const queueHint = useMemo(() => {
    const total = data?.length ?? 0;
    if (isLoading && total === 0) return "Loading bookings…";
    const q = normalizeQuery(searchQuery);
    if (q && filteredBookings.length !== total) {
      return `${filteredBookings.length} of ${total} appointments`;  
    }
    return `${total} appointments`;
  }, [isLoading, data?.length, filteredBookings.length, searchQuery]);

  /* This is the header that would appear at the top of the flatlist */
  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="titleMedium" color={textMuted}>
          {queueHint}
        </StyledText>
      </View>
    ),
    [queueHint, textMuted]
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">
          {normalizeQuery(searchQuery) ? "No matching bookings" : "No bookings"}
        </StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {normalizeQuery(searchQuery)
            ? "Try a different name or reference."
            : "When new bookings arrive, they will appear here."}
        </StyledText>
      </View>
    ),
    [searchQuery, textMuted]
  );

  const errorBanner = useMemo(
    () =>
      isError ? (
        <View style={[styles.errorBanner, { borderColor: textMuted }]}>
          <StyledText variant="bodyMedium" color={textMuted}>
            Could not load bookings. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY.
          </StyledText>
        </View>
      ) : null,
    [isError, textMuted]
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {errorBanner}
      {isLoading && (filteredBookings?.length || 0) === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.searchWrapWithPad}>
            <StyledTextInput
              placeholder="Search by reference, client name or email"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <FlatList
            style={styles.list}
            data={filteredBookings}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={empty}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshing={isFetching && (data?.length ?? 0) > 0}
            onRefresh={refetch}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  searchWrapWithPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: {
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  header: {
    marginBottom: 12,
    paddingTop: 4,
    paddingHorizontal: 10,
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 8,
  },
  loading: {
    flex: 1,
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
