import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, ListRenderItem, StyleSheet, View } from "react-native";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import StyledText from "@/app/components/helpers/StyledText";
import B2CCustomerItem from "@/app/components/customers/B2CCustomerItem";
import type { B2CListItem } from "@/app/interfaces/CustomerInterface";
import {
  useGetSupportPartnerCustomerDetailQuery,
  useGetSupportPartnerReferredUsersQuery,
} from "@/app/store/api/customerApi";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function PartnerReferredUsersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const partnerId = typeof id === "string" ? id : "";
  const backgroundColor = useThemeColor({}, "background");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");

  const { data: partner, isLoading: partnerLoading } = useGetSupportPartnerCustomerDetailQuery(
    partnerId,
    { skip: !partnerId }
  );
  const { data: referredUsers = [], isLoading: usersLoading } = useGetSupportPartnerReferredUsersQuery(
    partnerId,
    { skip: !partnerId }
  );

  const listAsB2C = useMemo((): B2CListItem[] => {
    return referredUsers.map((u) => ({
      id: u.id,
      type: "b2c",
      name: u.name,
      contact: u.contact,
      loyalty_tier: u.loyalty_tier,
      total_spend: u.total_spend,
      total_bookings: u.total_bookings,
    }));
  }, [referredUsers]);

  const onUserPress = useCallback(
    (user: B2CListItem) => {
      if (!partnerId) return;
      router.push({
        pathname: "/main/customers/PartnerReferredUserVehiclesScreen",
        params: { partnerId, userId: user.id },
      } as Href);
    },
    [partnerId, router]
  );

  const renderItem: ListRenderItem<B2CListItem> = useCallback(
    ({ item }) => <B2CCustomerItem customer={item} onPress={onUserPress} />,
    [onUserPress]
  );

  if (!partnerId) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Partner not found</StyledText>
      </View>
    );
  }

  if ((partnerLoading && !partner) || (usersLoading && referredUsers.length === 0)) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading referred users…
        </StyledText>
      </View>
    );
  }

  if (!partner) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Partner not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          Unable to load referred users.
        </StyledText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <FlatList
        data={listAsB2C}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <StyledText variant="titleLarge">Referred users</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              {partner.business_name} · {listAsB2C.length} referred users
            </StyledText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <StyledText variant="titleMedium">No referred users yet</StyledText>
            <StyledText variant="bodySmall" color={muted}>
              Users referred by this partner will appear here.
            </StyledText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 8,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 8,
    gap: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  emptyList: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
});
