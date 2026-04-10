import React, { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  StyleSheet,
  View,
} from "react-native";
import { type Href, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TicketItem from "@/app/components/tickets/TicketItem";
import StyledText from "@/app/components/helpers/StyledText";
import type { TicketListItem } from "@/app/interfaces/TicketInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useTicketFlow } from "@/app/app_hooks/useTicketFlow";

export default function TicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tickets, isLoading, isFetching, isError, refetch } = useTicketFlow();
  const backgroundColor = useThemeColor({}, "background");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const primaryColor = useThemeColor({}, "primary");

  const onPress = useCallback(
    (ticket: TicketListItem) => {
      router.push({
        pathname: "/main/tickets/TicketDetailScreen",
        params: { id: ticket.id },
      } as Href);
    },
    [router],
  );

  const renderItem: ListRenderItem<TicketListItem> = useCallback(
    ({ item }) => <TicketItem ticket={item} onPress={onPress} />,
    [onPress],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="bodySmall" color={textMuted}>
          Customer support requests. Tap a ticket to view details.
        </StyledText>
      </View>
    ),
    [textMuted],
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">No tickets</StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {isError
            ? "Could not load tickets. Pull to retry."
            : "There are no support tickets to show."}
        </StyledText>
      </View>
    ),
    [textMuted, isError],
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isLoading && !tickets.length ? (
        <ActivityIndicator
          size="large"
          color={primaryColor}
          style={styles.loader}
        />
      ) : null}
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        refreshing={isFetching && !isLoading}
        onRefresh={() => void refetch()}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 24 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  loader: {
    marginTop: 24,
  },
  header: {
    marginBottom: 16,
    gap: 6,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
});
