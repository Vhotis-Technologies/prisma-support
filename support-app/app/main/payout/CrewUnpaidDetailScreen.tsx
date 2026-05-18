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
import type { CrewUnpaidEarning } from "@/app/interfaces/PayoutInterface";
import { useGetCrewUnpaidEarningsDetailQuery } from "@/app/store/api/payoutApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

function EarningRow({
  earning,
  borderColor,
  muted,
}: {
  earning: CrewUnpaidEarning;
  borderColor: string;
  muted: string;
}) {
  return (
    <View style={[styles.earningRow, { borderColor }]}>
      <View style={styles.earningTop}>
        <StyledText variant="titleSmall" style={{ fontFamily: "BarlowMedium" }}>
          {earning.job_reference || "Job"}
        </StyledText>
        <StyledText variant="titleSmall" style={{ fontFamily: "BarlowMedium" }}>
          {formatCurrency(earning.net_amount)}
        </StyledText>
      </View>
      <StyledText variant="bodySmall" color={muted}>
        {earning.client_name}
        {earning.service_type ? ` · ${earning.service_type}` : ""}
      </StyledText>
      {earning.created_at_display ? (
        <StyledText variant="bodySmall" color={muted}>
          {earning.created_at_display}
        </StyledText>
      ) : null}
    </View>
  );
}

export default function CrewUnpaidDetailScreen() {
  const router = useRouter();
  const { crewMemberId } = useLocalSearchParams<{ crewMemberId: string }>();
  const id = typeof crewMemberId === "string" ? crewMemberId : "";

  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const primary = useThemeColor({}, "primary");
  const warning = useThemeColor({}, "warning");

  const { data, isLoading, isError, refetch, isFetching } =
    useGetCrewUnpaidEarningsDetailQuery(id, { skip: !id });

  const {
    paymentReference,
    setPaymentReference,
    adminNotes,
    setAdminNotes,
    isSubmitting,
    requestRecordCrewPaymentMade,
  } = usePayoutFlow();

  const bank = data?.bank_account;
  const hasBank = Boolean(bank?.has_bank_account && bank.iban);

  const canPay = useMemo(
    () => Boolean(data && data.unpaid_job_count > 0 && data.unpaid_amount > 0),
    [data],
  );

  if (!id) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <StyledText variant="titleLarge">Crew member not found</StyledText>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primary} />
        <StyledText variant="bodyMedium" color={muted}>
          Loading breakdown…
        </StyledText>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor }]}>
        <Ionicons name="alert-circle-outline" size={48} color={muted} />
        <StyledText variant="titleLarge">Could not load earnings</StyledText>
        <StyledButton title="Try again" onPress={() => void refetch()} variant="tonal" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="headlineSmall" style={styles.title}>
          {data.crew_member_name}
        </StyledText>
        <StyledText variant="bodyMedium" color={muted}>
          {data.crew_member_email}
        </StyledText>
        <StyledText
          variant="headlineMedium"
          style={{ fontFamily: "BarlowMedium", marginTop: 12 }}
        >
          {formatCurrency(data.unpaid_amount)}
        </StyledText>
        <StyledText variant="bodySmall" color={muted} style={{ marginTop: 4 }}>
          {data.unpaid_job_count} unpaid job
          {data.unpaid_job_count === 1 ? "" : "s"}
        </StyledText>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Bank account</StyledText>
        {hasBank ? (
          <>
            <View style={styles.bankRow}>
              <StyledText variant="labelMedium" color={muted}>
                Account holder
              </StyledText>
              <StyledText variant="bodyLarge" style={{ fontFamily: "BarlowMedium" }}>
                {bank!.account_name}
              </StyledText>
            </View>
            {bank!.bank_name ? (
              <View style={styles.bankRow}>
                <StyledText variant="labelMedium" color={muted}>
                  Bank
                </StyledText>
                <StyledText variant="bodyLarge" style={{ fontFamily: "BarlowMedium" }}>
                  {bank!.bank_name}
                </StyledText>
              </View>
            ) : null}
            <View style={styles.bankRow}>
              <StyledText variant="labelMedium" color={muted}>
                IBAN
              </StyledText>
              <StyledText
                variant="bodyLarge"
                style={{ fontFamily: "BarlowMedium" }}
                selectable
              >
                {bank!.iban}
              </StyledText>
            </View>
          </>
        ) : (
          <View style={[styles.warningBanner, { borderColor: warning, backgroundColor: `${warning}18` }]}>
            <Ionicons name="warning-outline" size={20} color={warning} />
            <StyledText variant="bodyMedium" style={{ flex: 1, color: warning }}>
              No bank account on file. Ask the crew member to add one in the app before paying.
            </StyledText>
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <StyledText variant="titleMedium">Earnings breakdown</StyledText>
        {data.earnings.map((earning) => (
          <EarningRow
            key={earning.id}
            earning={earning}
            borderColor={borderColor}
            muted={muted}
          />
        ))}
      </View>

      {canPay ? (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <StyledText variant="titleMedium">Record payment</StyledText>
          <StyledText variant="bodySmall" color={muted} style={{ marginBottom: 12 }}>
            After you send the bank transfer, record it here so the crew member sees completed payout history.
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
        </View>
      ) : null}

      <View style={styles.actions}>
        {canPay ? (
          <StyledButton
            title={isSubmitting ? "Recording…" : "Payment made"}
            onPress={() => requestRecordCrewPaymentMade(data, () => router.back())}
            disabled={isSubmitting || isFetching}
            variant="medium"
          />
        ) : null}
        <StyledButton
          title="Cancel"
          onPress={() => router.back()}
          disabled={isSubmitting}
          variant="tonal"
        />
      </View>
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
    gap: 10,
  },
  title: { fontFamily: "BarlowMedium" },
  bankRow: { gap: 4, marginTop: 4 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  earningRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
    gap: 4,
  },
  earningTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  actions: { gap: 10, marginTop: 4 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
});
