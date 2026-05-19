import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import StyledButton from "@/app/components/helpers/StyledButton";
import StyledText from "@/app/components/helpers/StyledText";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import { usePayoutFlow } from "@/app/app_hooks/usePayoutFlow";
import type { PayoutTabKind } from "@/app/interfaces/PayoutInterface";
import {
  useGetCrewPayoutDetailQuery,
  useGetPartnerPayoutQueueQuery,
} from "@/app/store/api/payoutApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

export default function PayoutDetailScreen() {
  const router = useRouter();
  const { id, kind } = useLocalSearchParams<{ id: string; kind: string }>();
  const payoutId = typeof id === "string" ? id : "";
  const payoutKind: PayoutTabKind = kind === "crew" ? "crew" : "partner";

  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const success = useThemeColor({}, "success");

  const partnerQuery = useGetPartnerPayoutQueueQuery(undefined, {
    skip: payoutKind !== "partner",
  });
  const crewDetailQuery = useGetCrewPayoutDetailQuery(payoutId, {
    skip: payoutKind !== "crew" || !payoutId,
  });

  const partnerItem = useMemo(
    () => (partnerQuery.data ?? []).find((p) => p.id === payoutId),
    [partnerQuery.data, payoutId],
  );
  const crewItem = crewDetailQuery.data ?? null;

  const {
    paymentReference,
    setPaymentReference,
    adminNotes,
    setAdminNotes,
    isSubmitting,
    requestMarkPartnerPaid,
  } = usePayoutFlow();

  const isLoading =
    payoutKind === "partner"
      ? partnerQuery.isLoading
      : crewDetailQuery.isLoading;
  const isPaidCrew =
    payoutKind === "crew" && crewItem && crewItem.status === "completed";
  const canMarkPaid =
    payoutKind === "partner" &&
    partnerItem &&
    ["pending", "processing"].includes(partnerItem.status);

  if (!payoutId) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Payout not found</StyledText>
      </View>
    );
  }

  if (isLoading && !partnerItem && !crewItem) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading payout…
        </StyledText>
      </View>
    );
  }

  if (payoutKind === "partner" && !partnerItem) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="cash-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Payout not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This request may have already been processed.
        </StyledText>
      </View>
    );
  }

  if (payoutKind === "crew" && !crewItem) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="people-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Payment not found</StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          This payment record could not be loaded.
        </StyledText>
        <StyledButton title="Go back" onPress={() => router.back()} variant="tonal" />
      </View>
    );
  }

  const title =
    payoutKind === "partner"
      ? partnerItem!.partner_name
      : crewItem!.crew_member_name;
  const email =
    payoutKind === "partner"
      ? partnerItem!.partner_user_email
      : crewItem!.crew_member_email;
  const amount =
    payoutKind === "partner"
      ? partnerItem!.amount_requested
      : crewItem!.amount;
  const status =
    payoutKind === "partner" ? partnerItem!.status : crewItem!.status;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="headlineSmall" style={styles.title}>
          {title}
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          {email}
        </StyledText>
        <StyledText variant="headlineMedium" style={{ fontFamily: "BarlowMedium", marginTop: 12 }}>
          {formatCurrency(amount)}
        </StyledText>
        {payoutKind === "crew" && crewItem ? (
          <>
            <StyledText variant="bodySmall" color={muted} style={{ marginTop: 8 }}>
              {crewItem.pay_frequency_label}
              {crewItem.period_start_display
                ? ` · ${crewItem.period_start_display} – ${crewItem.period_end_display}`
                : ""}
            </StyledText>
            {crewItem.paid_at_display ? (
              <StyledText variant="bodySmall" color={muted}>
                Paid {crewItem.paid_at_display}
              </StyledText>
            ) : null}
            {crewItem.payout_reference ? (
              <StyledText variant="bodySmall" color={muted}>
                Reference {crewItem.payout_reference}
              </StyledText>
            ) : null}
            {crewItem.admin_notes ? (
              <StyledText variant="bodySmall" color={muted}>
                Notes {crewItem.admin_notes}
              </StyledText>
            ) : null}
          </>
        ) : null}
        {payoutKind === "partner" && partnerItem?.requested_at_display ? (
          <StyledText variant="bodySmall" color={muted}>
            Requested {partnerItem.requested_at_display}
          </StyledText>
        ) : null}
        {status === "paid" || status === "completed" ? (
          <View style={[styles.paidBanner, { backgroundColor: `${success}18`, borderColor: success }]}>
            <Ionicons name="checkmark-circle" size={20} color={success} />
            <StyledText variant="bodyMedium" style={{ color: success }}>
              {payoutKind === "crew"
                ? "This crew payment has been recorded."
                : "This payout has been marked as paid."}
            </StyledText>
          </View>
        ) : null}
      </View>

      {canMarkPaid ? (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <StyledText variant="titleMedium">Complete payment</StyledText>
          <StyledText variant="bodySmall" color={muted} style={{ marginBottom: 12 }}>
            Record the bank transfer, then mark this payout as paid. The partner will be
            notified.
          </StyledText>
          <StyledTextInput
            label="Payment reference (optional)"
            value={paymentReference}
            onChangeText={setPaymentReference}
            placeholder="e.g. CHAPS ref, transaction ID"
          />
          <StyledTextInput
            label="Admin notes (optional)"
            value={adminNotes}
            onChangeText={setAdminNotes}
            placeholder="Internal note for support records"
            multiline
          />
          <StyledButton
            title={isSubmitting ? "Processing…" : "Mark as paid"}
            onPress={() => {
              if (partnerItem) {
                requestMarkPartnerPaid(partnerItem, () => router.back());
              }
            }}
            disabled={isSubmitting}
            variant="medium"
            style={{ marginTop: 16 }}
          />
        </View>
      ) : null}

      {isPaidCrew ? (
        <StyledButton title="Back" onPress={() => router.back()} variant="tonal" />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 6,
  },
  title: { fontFamily: "BarlowMedium" },
  paidBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
});
