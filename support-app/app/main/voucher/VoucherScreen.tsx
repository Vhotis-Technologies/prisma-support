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
import VoucherItem from "@/app/components/voucher/VoucherItem";
import CreateVoucherForm from "@/app/components/voucher/CreateVoucherForm";
import StyledText from "@/app/components/helpers/StyledText";
import StyledButton from "@/app/components/helpers/StyledButton";
import type { VoucherDetails } from "@/app/interfaces/VoucherInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useModalService } from "@/app/contexts/ModalServiceProvider";
import { useVoucherFlow } from "@/app/app_hooks/useVoucherFlow";

export default function VoucherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vouchers, isLoading, isFetching, isError, refetch, createVoucher } =
    useVoucherFlow();
  const { showFullscreenModal, closeModal } = useModalService();
  const backgroundColor = useThemeColor({}, "background");
  const primaryColor = useThemeColor({}, "primary");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );

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
        params: { id: voucher.id },
      } as Href);
    },
    [router],
  );

  const renderItem: ListRenderItem<VoucherDetails> = useCallback(
    ({ item }) => <VoucherItem voucher={item} onPress={onPressItem} />,
    [onPressItem],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <StyledText variant="bodySmall" color={textMuted}>
          Pre-assign winner vouchers by email. Customers with this email are
          linked automatically when the voucher is created or when they sign up.
        </StyledText>
        <View style={styles.cta}>
          <StyledButton
            title="Create voucher"
            onPress={openCreateModal}
            variant="tonal"
          />
        </View>
      </View>
    ),
    [textMuted, openCreateModal],
  );

  const empty = useMemo(
    () => (
      <View style={styles.empty}>
        <StyledText variant="titleMedium">No vouchers</StyledText>
        <StyledText variant="bodyMedium" color={textMuted}>
          {isError
            ? "Could not load vouchers. Pull to retry."
            : "Create a voucher to see it listed here."}
        </StyledText>
        <View style={styles.emptyBtn}>
          <StyledButton
            title="Create voucher"
            onPress={openCreateModal}
            variant="medium"
          />
        </View>
      </View>
    ),
    [textMuted, openCreateModal, isError],
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isLoading && !vouchers.length ? (
        <ActivityIndicator
          size="large"
          color={primaryColor}
          style={styles.loader}
        />
      ) : null}
      <FlatList
        data={vouchers}
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
  loader: {
    marginTop: 24,
  },
  content: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
    gap: 16,
  },
  cta: {
    alignSelf: "stretch",
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
