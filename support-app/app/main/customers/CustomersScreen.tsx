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
import StyledText from "@/app/components/helpers/StyledText";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import B2CCustomerItem from "@/app/components/customers/B2CCustomerItem";
import FleetCustomerItem from "@/app/components/customers/FleetCustomerItem";
import PartnerCustomerItem from "@/app/components/customers/PartnerCustomerItem";
import type {
  B2CListItem,
  CustomerSegment,
  FleetListItem,
  PartnerListItem,
  SupportCustomerListItem,
} from "@/app/interfaces/CustomerInterface";
import { useAppSelector } from "@/app/store/main_store";
import { useGetSupportCustomersListQuery } from "@/app/store/api/customerApi";
import { useThemeColor } from "@/hooks/useThemeColor";

type CustomerTab = CustomerSegment;

const TABS: Array<{ key: CustomerTab; label: string }> = [
  { key: "b2c", label: "B2C" },
  { key: "guests", label: "Guests" },
  { key: "fleets", label: "Fleets" },
  { key: "partners", label: "Partners" },
];

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function isB2CListItem(r: SupportCustomerListItem): r is B2CListItem {
  return r.type === "b2c";
}

function isFleetListItem(r: SupportCustomerListItem): r is FleetListItem {
  return r.type === "fleet";
}

function isPartnerListItem(r: SupportCustomerListItem): r is PartnerListItem {
  return r.type === "partner";
}

function customerMatchesSearch(item: SupportCustomerListItem, q: string): boolean {
  if (!q) return true;
  if (item.type === "b2c") {
    const b = item as B2CListItem;
    return (
      b.name.toLowerCase().includes(q) ||
      b.contact.email.toLowerCase().includes(q) ||
      (b.contact.phone ?? "").toLowerCase().includes(q)
    );
  }
  if (item.type === "fleet") {
    const f = item as FleetListItem;
    return (
      f.name.toLowerCase().includes(q) ||
      f.fleet_owner.toLowerCase().includes(q) ||
      f.contact.email.toLowerCase().includes(q)
    );
  }
  const p = item as PartnerListItem;
  return (
    p.business_name.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.contact.email.toLowerCase().includes(q) ||
    p.referral_code.toLowerCase().includes(q)
  );
}

export default function CustomersScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const access = useAppSelector((s) => s.auth.access);
  const [activeTab, setActiveTab] = useState<CustomerTab>("b2c");
  const [searchQuery, setSearchQuery] = useState("");
  const backgroundColor = useThemeColor({}, "background");
  const borderColor = useThemeColor({}, "borders");
  const tint = useThemeColor({}, "tint");
  const textMuted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");

  const customersQuery = useGetSupportCustomersListQuery(activeTab, {
    skip: !isFocused || !access,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
  });
  const customersRows = customersQuery.data;
  const isLoading = customersQuery.isLoading;
  const isError = customersQuery.isError;
  const isFetching = customersQuery.isFetching;
  const refetch = customersQuery.refetch;

  const filteredRows = useMemo(() => {
    const rows = customersRows ?? [];
    const q = normalizeQuery(searchQuery);
    if (!q) return rows;
    return rows.filter((row) => customerMatchesSearch(row, q));
  }, [customersRows, searchQuery]);

  /** Rows actually rendered for this tab (same filters as each FlatList). */
  const rowsForActiveTab = useMemo(() => {
    if (activeTab === "b2c") return filteredRows.filter(isB2CListItem);
    if (activeTab === "guests") return filteredRows.filter(isB2CListItem);
    if (activeTab === "fleets") return filteredRows.filter(isFleetListItem);
    return filteredRows.filter(isPartnerListItem);
  }, [activeTab, filteredRows]);

  const queueHint = useMemo(() => {
    const sourceTotal = customersRows?.length ?? 0;
    const visible = rowsForActiveTab.length;
    if (isLoading && sourceTotal === 0 && visible === 0) return "Loading customers…";
    const q = normalizeQuery(searchQuery);
    if (q && filteredRows.length !== sourceTotal) {
      return `${filteredRows.length} of ${sourceTotal} customers`;
    }
    if (q && visible !== filteredRows.length) {
      return `${visible} of ${filteredRows.length} customers`;
    }
    return `${visible} customers`;
  }, [
    isLoading,
    customersRows?.length,
    filteredRows.length,
    rowsForActiveTab.length,
    searchQuery,
  ]);

  /** Only show the config hint when we never got a successful payload (not for “empty list” or stale cache). */
  const showLoadFailureBanner = isError && customersRows === undefined;

  const onB2CPress = useCallback(
    (customer: B2CListItem) => {
      router.push({
        pathname: "/main/customers/B2CDetailsScreen",
        params: { id: customer.id },
      } as Href);
    },
    [router]
  );

  const onFleetPress = useCallback(
    (customer: FleetListItem) => {
      router.push({
        pathname: "/main/customers/FleetDetailsScreen",
        params: { id: customer.id },
      } as Href);
    },
    [router]
  );

  const onPartnerPress = useCallback(
    (customer: PartnerListItem) => {
      router.push({
        pathname: "/main/customers/PartnerDetailsScreen",
        params: { id: customer.id },
      } as Href);
    },
    [router]
  );

  const renderB2C: ListRenderItem<B2CListItem> = useCallback(
    ({ item }) => <B2CCustomerItem customer={item} onPress={onB2CPress} />,
    [onB2CPress]
  );

  const renderFleet: ListRenderItem<FleetListItem> = useCallback(
    ({ item }) => <FleetCustomerItem customer={item} onPress={onFleetPress} />,
    [onFleetPress]
  );

  const renderPartner: ListRenderItem<PartnerListItem> = useCallback(
    ({ item }) => <PartnerCustomerItem customer={item} onPress={onPartnerPress} />,
    [onPartnerPress]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
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
    [activeTab, borderColor, queueHint, textMuted, tint]
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">
          {normalizeQuery(searchQuery) ? "No matching customers" : "No customers found"}
        </StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {normalizeQuery(searchQuery)
            ? "Try a different name or email."
            : "When customer records exist on the client API, they will appear here."}
        </StyledText>
      </View>
    ),
    [searchQuery, textMuted]
  );

  const errorBanner = useMemo(
    () =>
      showLoadFailureBanner ? (
        <View style={[styles.errorBanner, { borderColor: textMuted }]}>
          <StyledText variant="bodyMedium" color={textMuted}>
            Could not load customers. Check CLIENT_API_URL and SUPPORT_INTERNAL_API_KEY on the
            support server.
          </StyledText>
        </View>
      ) : null,
    [showLoadFailureBanner, textMuted]
  );

  const b2cList = (
    <FlatList
      data={filteredRows.filter(isB2CListItem)}
      keyExtractor={(item) => item.id}
      renderItem={renderB2C}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={empty}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshing={isFetching && !isLoading}
      onRefresh={refetch}
    />
  );

  const fleetList = (
    <FlatList
      data={filteredRows.filter(isFleetListItem)}
      keyExtractor={(item) => item.id}
      renderItem={renderFleet}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={empty}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshing={isFetching && !isLoading}
      onRefresh={refetch}
    />
  );

  const partnerList = (
    <FlatList
      data={filteredRows.filter(isPartnerListItem)}
      keyExtractor={(item) => item.id}
      renderItem={renderPartner}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={empty}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshing={isFetching && !isLoading}
      onRefresh={refetch}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {errorBanner}
      {isLoading && (customersRows?.length ?? 0) === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.searchWrap}>
            <StyledTextInput
              placeholder="Search by name, email, or referral code"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          {activeTab === "b2c" ? b2cList : null}
          {activeTab === "guests" ? b2cList : null}
          {activeTab === "fleets" ? fleetList : null}
          {activeTab === "partners" ? partnerList : null}
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
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  content: {
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 8,
  },
  header: {
    width: "100%",
    marginBottom: 5,
    gap: 4,
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    borderRadius: 20,
    paddingVertical: 8,
    width: "30%",
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
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
