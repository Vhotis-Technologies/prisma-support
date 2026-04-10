import React, { useCallback, useMemo, useState } from "react";
import { FlatList, ListRenderItem, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationItem from "@/app/components/notifications/NotificationItem";
import StyledText from "@/app/components/helpers/StyledText";
import type { SupportNotificationItem } from "@/app/interfaces/NotificationInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAlertContext } from "@/app/contexts/AlertContext";

/** Placeholder inbox until notifications are loaded from your API or push history. */
const SEED_NOTIFICATIONS: SupportNotificationItem[] = [
  {
    id: "1",
    title: "New booking request",
    body: "Sarah K. requested Thu 10 Apr · Gel polish",
    createdAt: new Date(Date.now() - 9 * 60_000).toISOString(),
    read: false,
    category: "booking",
  },
  {
    id: "2",
    title: "Voucher redeemed",
    body: "Code PRISMA-9F2 was used · €45.00",
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    read: false,
    category: "voucher",
  },
  {
    id: "3",
    title: "Ticket #4821 updated",
    body: "Customer replied to your last message",
    createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    read: true,
    category: "ticket",
  },
  {
    id: "4",
    title: "Weekly summary",
    body: "12 bookings completed · tap for details",
    createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    read: true,
    category: "system",
  },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, "background");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const { setAlertConfig, setIsVisible } = useAlertContext();

  const [items, setItems] = useState<SupportNotificationItem[]>(SEED_NOTIFICATIONS);

  const onPressItem = useCallback(
    (n: SupportNotificationItem) => {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setAlertConfig({
        isVisible: true,
        title: n.title,
        message: n.body,
        type: "warning",
        confirmLabel: "OK",
        onConfirm: () => setIsVisible(false),
      });
    },
    [setAlertConfig, setIsVisible],
  );

  const renderItem: ListRenderItem<SupportNotificationItem> = useCallback(
    ({ item }) => (
      <NotificationItem notification={item} onPress={onPressItem} />
    ),
    [onPressItem],
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">No notifications</StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          New alerts for bookings, vouchers, and tickets will appear here.
        </StyledText>
      </View>
    ),
    [textMuted],
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={empty}
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
  empty: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 8,
  },
});
