import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { type Href, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CrewPayoutItem from "@/app/components/payout/CrewPayoutItem";
import PartnerPayoutItem from "@/app/components/payout/PartnerPayoutItem";
import StyledText from "@/app/components/helpers/StyledText";
import type {
  CrewPayoutQueueItem,
  PartnerPayoutQueueItem,
  PayoutTabKind,
} from "@/app/interfaces/PayoutInterface";
import { useAppSelector } from "@/app/store/main_store";
import {
  useGetCrewPayoutQueueQuery,
  useGetPartnerPayoutQueueQuery,
} from "@/app/store/api/payoutApi";
import { useThemeColor } from "@/hooks/useThemeColor";

const TABS: { key: PayoutTabKind; label: string }[] = [
  { key: "partner", label: "Partners" },
  { key: "crew", label: "Crew" },
];

export default function PayoutScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const access = useAppSelector((s) => s.auth.access);
  const [activeTab, setActiveTab] = useState<PayoutTabKind>("partner");

  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "borders");
  const tint = useThemeColor({}, "tint");
  const textMuted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");

  const partnerQuery = useGetPartnerPayoutQueueQuery(undefined, {
    skip: !isFocused || !access,
    refetchOnMountOrArgChange: true,
  });
  const crewQuery = useGetCrewPayoutQueueQuery(undefined, {
    skip: !isFocused || !access,
    refetchOnMountOrArgChange: true,
  });

  const listData = activeTab === "partner" ? partnerQuery.data ?? [] : crewQuery.data ?? [];
  const isLoading =
    activeTab === "partner" ? partnerQuery.isLoading : crewQuery.isLoading;
  const isFetching =
    activeTab === "partner" ? partnerQuery.isFetching : crewQuery.isFetching;
  const isError = activeTab === "partner" ? partnerQuery.isError : crewQuery.isError;

  const refetch = useCallback(() => {
    if (activeTab === "partner") return partnerQuery.refetch();
    return crewQuery.refetch();
  }, [activeTab, partnerQuery, crewQuery]);

  const queueHint = useMemo(() => {
    const n = listData.length;
    if (isLoading && n === 0) return "Loading payouts…";
    if (activeTab === "partner") {
      return n === 0
        ? "No pending partner payout requests"
        : `${n} partner payout${n === 1 ? "" : "s"} awaiting payment`;
    }
    return n === 0
      ? "No pending crew payouts"
      : `${n} crew payout${n === 1 ? "" : "s"} awaiting payment`;
  }, [activeTab, isLoading, listData.length]);

  const onPartnerPress = useCallback(
    (item: PartnerPayoutQueueItem) => {
      router.push(
        `/main/payout/PayoutDetailScreen?id=${encodeURIComponent(item.id)}&kind=partner` as Href,
      );
    },
    [router],
  );

  const onCrewPress = useCallback(
    (item: CrewPayoutQueueItem) => {
      router.push(
        `/main/payout/PayoutDetailScreen?id=${encodeURIComponent(item.id)}&kind=crew` as Href,
      );
    },
    [router],
  );

  const renderPartner: ListRenderItem<PartnerPayoutQueueItem> = useCallback(
    ({ item }) => <PartnerPayoutItem item={item} onPress={onPartnerPress} />,
    [onPartnerPress],
  );

  const renderCrew: ListRenderItem<CrewPayoutQueueItem> = useCallback(
    ({ item }) => <CrewPayoutItem item={item} onPress={onCrewPress} />,
    [onCrewPress],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="bodySmall" color={textMuted}>
          {activeTab === "partner"
            ? "Partner commission payout requests from the client app. Mark as paid after bank transfer."
            : "Crew earnings payouts from the detailer app. Mark as paid after bank transfer."}
        </StyledText>
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.tab,
                  {
                    borderColor: isActive ? tint : borderColor,
                    borderWidth: isActive ? 1 : 0,
                  },
                ]}
              >
                <StyledText
                  variant="labelLarge"
                  style={{ color: isActive ? tint : undefined, fontFamily: "BarlowMedium" }}
                >
                  {tab.label}
                </StyledText>
              </Pressable>
            );
          })}
        </View>
        <StyledText variant="bodyMedium" color={textMuted}>
          {queueHint}
        </StyledText>
      </View>
    ),
    [activeTab, borderColor, queueHint, textMuted, tint],
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">
          {activeTab === "partner" ? "No partner payouts" : "No crew payouts"}
        </StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {isError
            ? "Could not load payouts. Pull to retry."
            : activeTab === "partner"
              ? "When a partner requests commission payment, it will appear here."
              : "When crew payouts are due, they will appear here."}
        </StyledText>
      </View>
    ),
    [activeTab, isError, textMuted],
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isLoading && !listData.length ? (
        <ActivityIndicator size="large" color={primary} style={styles.loader} />
      ) : null}
      {activeTab === "partner" ? (
        <FlatList
          data={partnerQuery.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderPartner}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={empty}
          refreshing={isFetching && !isLoading}
          onRefresh={() => void refetch()}
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={crewQuery.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderCrew}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={empty}
          refreshing={isFetching && !isLoading}
          onRefresh={() => void refetch()}
          contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 24 },
  content: { paddingHorizontal: 8, paddingTop: 8 },
  header: { marginBottom: 16, gap: 12 },
  tabRow: { flexDirection: "row", gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  empty: { paddingVertical: 48, alignItems: "center", gap: 8 },
});
