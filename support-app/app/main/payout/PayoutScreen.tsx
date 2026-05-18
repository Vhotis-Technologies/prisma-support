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
import CrewUnpaidItem from "@/app/components/payout/CrewUnpaidItem";
import PartnerPayoutItem from "@/app/components/payout/PartnerPayoutItem";
import StyledText from "@/app/components/helpers/StyledText";
import type {
  CrewPayoutQueueItem,
  CrewUnpaidSummary,
  PartnerPayoutQueueItem,
  PayoutTabKind,
} from "@/app/interfaces/PayoutInterface";
import { useAppSelector } from "@/app/store/main_store";
import {
  useGetCrewPayoutQueueQuery,
  useGetCrewUnpaidEarningsQuery,
  useGetPartnerPayoutQueueQuery,
} from "@/app/store/api/payoutApi";
import { useThemeColor } from "@/hooks/useThemeColor";

const TABS: { key: PayoutTabKind; label: string }[] = [
  { key: "partner", label: "Partners" },
  { key: "crew", label: "Crew" },
];

type CrewSubTab = "unpaid" | "queue";

const CREW_SUB_TABS: { key: CrewSubTab; label: string }[] = [
  { key: "unpaid", label: "Unpaid earnings" },
  { key: "queue", label: "Payout queue" },
];

export default function PayoutScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const access = useAppSelector((s) => s.auth.access);
  const [activeTab, setActiveTab] = useState<PayoutTabKind>("partner");
  const [crewSubTab, setCrewSubTab] = useState<CrewSubTab>("unpaid");

  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "borders");
  const tint = useThemeColor({}, "tint");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const primary = useThemeColor({}, "primary");

  const partnerQuery = useGetPartnerPayoutQueueQuery(undefined, {
    skip: !isFocused || !access,
    refetchOnMountOrArgChange: true,
  });
  const crewQuery = useGetCrewPayoutQueueQuery(undefined, {
    skip:
      !isFocused || !access || activeTab !== "crew" || crewSubTab !== "queue",
    refetchOnMountOrArgChange: true,
  });
  const crewUnpaidQuery = useGetCrewUnpaidEarningsQuery(undefined, {
    skip:
      !isFocused || !access || activeTab !== "crew" || crewSubTab !== "unpaid",
    refetchOnMountOrArgChange: true,
  });

  const isLoading = useMemo(() => {
    if (activeTab === "partner") return partnerQuery.isLoading;
    return crewSubTab === "unpaid"
      ? crewUnpaidQuery.isLoading
      : crewQuery.isLoading;
  }, [
    activeTab,
    crewSubTab,
    crewQuery.isLoading,
    crewUnpaidQuery.isLoading,
    partnerQuery.isLoading,
  ]);

  const isFetching = useMemo(() => {
    if (activeTab === "partner") return partnerQuery.isFetching;
    return crewSubTab === "unpaid"
      ? crewUnpaidQuery.isFetching
      : crewQuery.isFetching;
  }, [
    activeTab,
    crewSubTab,
    crewQuery.isFetching,
    crewUnpaidQuery.isFetching,
    partnerQuery.isFetching,
  ]);

  const isError = useMemo(() => {
    if (activeTab === "partner") return partnerQuery.isError;
    return crewSubTab === "unpaid"
      ? crewUnpaidQuery.isError
      : crewQuery.isError;
  }, [
    activeTab,
    crewSubTab,
    crewQuery.isError,
    crewUnpaidQuery.isError,
    partnerQuery.isError,
  ]);

  const refetch = useCallback(() => {
    if (activeTab === "partner") return partnerQuery.refetch();
    return crewSubTab === "unpaid"
      ? crewUnpaidQuery.refetch()
      : crewQuery.refetch();
  }, [activeTab, crewSubTab, crewQuery, crewUnpaidQuery, partnerQuery]);

  const queueHint = useMemo(() => {
    if (activeTab === "partner") {
      const n = partnerQuery.data?.length ?? 0;
      if (isLoading && n === 0) return "Loading payouts…";
      return n === 0
        ? "No pending partner payout requests"
        : `${n} partner payout${n === 1 ? "" : "s"} awaiting payment`;
    }
    if (crewSubTab === "unpaid") {
      const n = crewUnpaidQuery.data?.length ?? 0;
      if (isLoading && n === 0) return "Loading unpaid earnings…";
      return n === 0
        ? "No crew with unpaid earnings"
        : `${n} crew member${n === 1 ? "" : "s"} with unpaid earnings`;
    }
    const n = crewQuery.data?.length ?? 0;
    if (isLoading && n === 0) return "Loading payouts…";
    return n === 0
      ? "No pending crew payouts"
      : `${n} crew payout${n === 1 ? "" : "s"} awaiting payment`;
  }, [
    activeTab,
    crewSubTab,
    crewQuery.data?.length,
    crewUnpaidQuery.data?.length,
    isLoading,
    partnerQuery.data?.length,
  ]);

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

  const onUnpaidPress = useCallback(
    (item: CrewUnpaidSummary) => {
      router.push(
        `/main/payout/CrewUnpaidDetailScreen?crewMemberId=${encodeURIComponent(item.crew_member_id)}` as Href,
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

  const renderUnpaid: ListRenderItem<CrewUnpaidSummary> = useCallback(
    ({ item }) => <CrewUnpaidItem item={item} onPress={onUnpaidPress} />,
    [onUnpaidPress],
  );

  const headerCopy = useMemo(() => {
    if (activeTab === "partner") {
      return "Partner commission payout requests from the client app. The server re-validates the amount against the partner's approved balance before completing the transfer.";
    }
    if (crewSubTab === "unpaid") {
      return "Crew members can't request payouts — support pays them directly. Tap a crew member to see the job breakdown and bank details, then record payment after the transfer.";
    }
    return "Crew payouts you've created. Open one to record the bank reference and mark it paid; the linked earnings are released to the crew member.";
  }, [activeTab, crewSubTab]);

  const renderCrewSubTabs = useCallback(() => {
    if (activeTab !== "crew") return null;
    return (
      <View style={styles.subTabRow}>
        {CREW_SUB_TABS.map((sub) => {
          const isActive = sub.key === crewSubTab;
          return (
            <Pressable
              key={sub.key}
              onPress={() => setCrewSubTab(sub.key)}
              style={[
                styles.subTab,
                {
                  borderColor: isActive ? tint : borderColor,
                  backgroundColor: isActive ? `${tint}15` : "transparent",
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <StyledText
                variant="labelMedium"
                style={{
                  color: isActive ? tint : undefined,
                  fontFamily: "BarlowMedium",
                }}
              >
                {sub.label}
              </StyledText>
            </Pressable>
          );
        })}
      </View>
    );
  }, [activeTab, borderColor, crewSubTab, tint]);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="bodySmall" color={textMuted}>
          {headerCopy}
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
                  style={{
                    color: isActive ? tint : undefined,
                    fontFamily: "BarlowMedium",
                  }}
                >
                  {tab.label}
                </StyledText>
              </Pressable>
            );
          })}
        </View>
        {renderCrewSubTabs()}
        <StyledText variant="bodyMedium" color={textMuted}>
          {queueHint}
        </StyledText>
      </View>
    ),
    [
      activeTab,
      borderColor,
      headerCopy,
      queueHint,
      renderCrewSubTabs,
      textMuted,
      tint,
    ],
  );

  const emptyMessage = useMemo(() => {
    if (isError) return "Could not load payouts. Pull to retry.";
    if (activeTab === "partner") {
      return "When a partner requests commission payment, it will appear here.";
    }
    if (crewSubTab === "unpaid") {
      return "Crew members with completed jobs and unpaid earnings will appear here. Pull to refresh.";
    }
    return "Crew payouts you create will appear here.";
  }, [activeTab, crewSubTab, isError]);

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">
          {activeTab === "partner"
            ? "No partner payouts"
            : crewSubTab === "unpaid"
              ? "No unpaid earnings"
              : "No crew payouts"}
        </StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {emptyMessage}
        </StyledText>
      </View>
    ),
    [activeTab, crewSubTab, emptyMessage, textMuted],
  );

  const showCrewQueueList = activeTab === "crew" && crewSubTab === "queue";
  const showCrewUnpaidList = activeTab === "crew" && crewSubTab === "unpaid";

  const hasData =
    activeTab === "partner"
      ? (partnerQuery.data?.length ?? 0) > 0
      : showCrewQueueList
        ? (crewQuery.data?.length ?? 0) > 0
        : (crewUnpaidQuery.data?.length ?? 0) > 0;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isLoading && !hasData ? (
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
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 24 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : showCrewUnpaidList ? (
        <FlatList
          data={crewUnpaidQuery.data ?? []}
          keyExtractor={(item) => item.crew_member_id}
          renderItem={renderUnpaid}
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
      ) : (
        <FlatList
          data={crewQuery.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderCrew}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { marginTop: 24 },
  content: { paddingHorizontal: 8, paddingTop: 8 },
  header: { marginBottom: 16, gap: 12, width: "100%" },
  tabRow: { flexDirection: "row", gap: 8, flex:1},
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subTabRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  subTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  empty: { paddingVertical: 48, alignItems: "center", gap: 8 },
});
