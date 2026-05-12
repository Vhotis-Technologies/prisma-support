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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VoucherItem from "@/app/components/voucher/VoucherItem";
import CreateVoucherForm from "@/app/components/voucher/CreateVoucherForm";
import StyledText from "@/app/components/helpers/StyledText";
import StyledButton from "@/app/components/helpers/StyledButton";
import type { VoucherDetails } from "@/app/interfaces/VoucherInterface";
import type { VoucherTabKind } from "@/app/app_hooks/useVoucherFlow";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useModalService } from "@/app/contexts/ModalServiceProvider";
import {
  useGiftVoucherFlow,
  useWinnerVoucherFlow,
} from "@/app/app_hooks/useVoucherFlow";

const TABS: { key: VoucherTabKind; label: string }[] = [
  { key: "winner", label: "Winner" },
  { key: "gift", label: "Gifting" },
];

export default function VoucherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<VoucherTabKind>("winner");

  const winnerFlow = useWinnerVoucherFlow();
  const giftFlow = useGiftVoucherFlow();

  const { createVoucher, isCreating } = winnerFlow;

  const { showFullscreenModal, closeModal } = useModalService();
  const backgroundColor = useThemeColor({}, "background");
  const primaryColor = useThemeColor({}, "primary");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );

  const listData =
    activeTab === "winner" ? winnerFlow.vouchers : giftFlow.vouchers;
  const isLoading =
    activeTab === "winner"
      ? winnerFlow.isLoading
      : giftFlow.isLoading || isCreating;
  const isFetching =
    activeTab === "winner" ? winnerFlow.isFetching : giftFlow.isFetching;
  const isError =
    activeTab === "winner" ? winnerFlow.isError : giftFlow.isError;

  const refetch = useCallback(() => {
    if (activeTab === "winner") return winnerFlow.refetch();
    return giftFlow.refetch();
  }, [activeTab, winnerFlow, giftFlow]);

  const openCreateModal = useCallback(() => {
    showFullscreenModal(
      <CreateVoucherForm
        onCreate={async (body) => {
          await createVoucher(body);
        }}
        onSuccess={() => closeModal()}
      />,
      "Create voucher",
    );
  }, [showFullscreenModal, closeModal, createVoucher]);

  const onPressItem = useCallback(
    (voucher: VoucherDetails) => {
      router.push({
        pathname: "/main/voucher/VoucherDetailScreen",
        params: { id: voucher.id, kind: voucher.kind ?? activeTab },
      } as Href);
    },
    [router, activeTab],
  );

  const renderTab = useCallback(
    (tab: (typeof TABS)[number]) => {
      const isActive = activeTab === tab.key;
      return (
        <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)}>
          <StyledText
            variant="bodySmall"
            color={isActive ? primaryColor : textMuted}
            style={[styles.tabLabel, isActive && styles.tabLabelActive]}
          >
            {tab.label}
          </StyledText>
        </Pressable>
      );
    },
    [activeTab, primaryColor, textMuted],
  );

  const renderItem: ListRenderItem<VoucherDetails> = useCallback(
    ({ item }) => (
      <VoucherItem voucher={item} onPress={onPressItem} />
    ),
    [onPressItem],
  );

  const listHeaderText = useMemo(() => {
    if (activeTab === "winner") {
      return "Pre-assign winner vouchers by email. Customers with this email are linked automatically when the voucher is created or when they sign up.";
    }
    return "Customer-purchased gift vouchers. Recipient email sends only after Stripe confirms payment (webhook).";
  }, [activeTab]);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="bodySmall" color={textMuted}>
          {listHeaderText}
        </StyledText>
        <View style={styles.tabRow}>{TABS.map((t) => renderTab(t))}</View>
        {activeTab === "winner" ? (
          <View style={styles.cta}>
            <StyledButton
              title="Create voucher"
              onPress={openCreateModal}
              variant="tonal"
            />
          </View>
        ) : null}
      </View>
    ),
    [textMuted, listHeaderText, renderTab, openCreateModal, activeTab],
  );

  const emptyMessage = useMemo(() => {
    if (activeTab === "winner") {
      return isError
        ? "Could not load vouchers. Pull to retry."
        : "Create a voucher to see it listed here.";
    }
    return isError
      ? "Could not load gift vouchers. Pull to retry."
      : "Gift vouchers purchased in the customer app appear here.";
  }, [activeTab, isError]);

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">
          {activeTab === "winner" ? "No vouchers" : "No gift vouchers"}
        </StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {emptyMessage}
        </StyledText>
        {activeTab === "winner" ? (
          <View style={styles.emptyBtn}>
            <StyledButton
              title="Create voucher"
              onPress={openCreateModal}
              variant="medium"
            />
          </View>
        ) : null}
      </View>
    ),
    [textMuted, openCreateModal, emptyMessage, activeTab],
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isLoading && !listData.length ? (
        <ActivityIndicator
          size="large"
          color={primaryColor}
          style={styles.loader}
        />
      ) : null}
      <FlatList
        data={listData}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
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
  loader: {
    marginTop: 24,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
    gap: 12,
  },
  cta: {
    alignSelf: "stretch",
  },
  tabRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
    alignItems: "center",
  },
  tabLabel: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tabLabelActive: {
    fontFamily: "BarlowMedium",
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 8,
  },
  emptyBtn: {
    marginTop: 16,
  },
});
