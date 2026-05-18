/**
 * Bottom-sheet modal that drives a crew reassignment flow: pick a reason, browse the detailers
 * the crew API confirmed are free for the slot, select replacements, and submit.
 *
 * Pure presentation — all state and side effects come from {@link useReassignFlow}. This makes
 * it trivially reusable from both the single-booking and the bulk-order detail screens.
 */
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import type {
  ReassignmentCandidate,
  ReassignmentReasonCode,
} from "@/app/interfaces/BookingInterface";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { useReassignFlow } from "@/app/app_hooks/useReassignFlow";

type ReassignFlow = ReturnType<typeof useReassignFlow>;

type Props = {
  flow: ReassignFlow;
};

function reasonLabel(code: ReassignmentReasonCode, reasons: ReassignFlow["reasons"]): string {
  return reasons.find((r) => r.code === code)?.label ?? code;
}

function CandidateRow({
  candidate,
  selected,
  onPress,
  borderColor,
  primary,
  muted,
  textColor,
}: {
  candidate: ReassignmentCandidate;
  selected: boolean;
  onPress: () => void;
  borderColor: string;
  primary: string;
  muted: string;
  textColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.candidateRow,
        {
          borderColor: selected ? primary : borderColor,
          backgroundColor: selected ? `${primary}14` : "transparent",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: `${primary}22` }]}>
        <StyledText variant="labelLarge" style={{ color: primary }}>
          {candidate.name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase() ?? "")
            .join("") || "DT"}
        </StyledText>
      </View>
      <View style={styles.candidateText}>
        <StyledText
          variant="titleSmall"
          style={{ fontFamily: "BarlowMedium", color: textColor }}
          numberOfLines={1}
        >
          {candidate.name}
        </StyledText>
        <StyledText variant="bodySmall" color={muted} numberOfLines={1}>
          {candidate.phone || candidate.email || "No contact info"}
        </StyledText>
        {candidate.rating > 0 ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={primary} />
            <StyledText variant="labelSmall" color={muted}>
              {candidate.rating.toFixed(1)}
            </StyledText>
          </View>
        ) : null}
      </View>
      <Ionicons
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={22}
        color={selected ? primary : muted}
      />
    </Pressable>
  );
}

export default function ReassignCrewModal({ flow }: Props) {
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const muted = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  const textColor = useThemeColor({}, "text");
  const primary = useThemeColor({}, "primary");
  const tint = useThemeColor({}, "tint");

  const {
    visible,
    close,
    isLoading,
    isSubmitting,
    candidates,
    requirement,
    reasonCode,
    setReasonCode,
    reasonNotes,
    setReasonNotes,
    selectedIds,
    toggleCandidate,
    submit,
    canSubmit,
    reasons,
  } = flow;

  const renderItem: ListRenderItem<ReassignmentCandidate> = ({ item }) => (
    <CandidateRow
      candidate={item}
      selected={selectedIds.includes(item.id)}
      onPress={() => toggleCandidate(item.id)}
      borderColor={borderColor}
      primary={primary}
      muted={muted}
      textColor={textColor}
    />
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          style={[styles.card, { backgroundColor: cardBg, borderColor }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <StyledText variant="titleMedium" style={{ fontFamily: "BarlowMedium" }}>
                Reassign crew
              </StyledText>
              <StyledText variant="bodySmall" color={muted}>
                {requirement?.is_bulk
                  ? `Replace the team across ${requirement.job_count} vehicles. Pick at least one — extras spread the load.`
                  : requirement?.is_express
                    ? "Express jobs require two replacement detailers."
                    : "Pick one replacement detailer free for this slot."}
              </StyledText>
            </View>
            <Pressable onPress={close} hitSlop={8}>
              <Ionicons name="close" size={22} color={muted} />
            </Pressable>
          </View>

          <StyledText variant="labelMedium" color={muted} style={styles.blockLabel}>
            Reason
          </StyledText>
          <View style={styles.reasonsRow}>
            {reasons.map((r) => {
              const selected = r.code === reasonCode;
              return (
                <Pressable
                  key={r.code}
                  onPress={() => setReasonCode(r.code)}
                  style={({ pressed }) => [
                    styles.reasonChip,
                    {
                      borderColor: selected ? primary : borderColor,
                      backgroundColor: selected ? `${primary}14` : "transparent",
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <StyledText
                    variant="labelMedium"
                    style={{
                      color: selected ? primary : textColor,
                      fontFamily: "BarlowMedium",
                    }}
                  >
                    {r.label}
                  </StyledText>
                </Pressable>
              );
            })}
          </View>

          <StyledText variant="labelMedium" color={muted} style={styles.blockLabel}>
            Notes (optional)
          </StyledText>
          <TextInput
            value={reasonNotes}
            onChangeText={setReasonNotes}
            placeholder={`Context for ${reasonLabel(reasonCode, reasons).toLowerCase()}…`}
            placeholderTextColor={muted}
            multiline
            editable={!isSubmitting}
            style={[
              styles.notesInput,
              { borderColor, color: textColor, fontFamily: "BarlowRegular" },
            ]}
          />

          <View style={styles.candidatesHeader}>
            <StyledText variant="labelMedium" color={muted}>
              Available detailers
              {requirement
                ? requirement.is_bulk
                  ? `   ·   ${selectedIds.length} selected`
                  : `   ·   ${selectedIds.length}/${requirement.required_count}`
                : ""}
            </StyledText>
            {isLoading ? <ActivityIndicator size="small" color={primary} /> : null}
          </View>

          {isLoading && candidates.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={primary} />
              <StyledText variant="bodyMedium" color={muted}>
                Looking for replacements…
              </StyledText>
            </View>
          ) : candidates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={28} color={tint} />
              <StyledText variant="bodyMedium" color={muted} style={{ textAlign: "center" }}>
                No detailers are free for this slot. Try rescheduling first or contact crew ops.
              </StyledText>
            </View>
          ) : (
            <FlatList
              data={candidates}
              keyExtractor={(c) => c.id}
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={close}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.secondary,
                { borderColor, opacity: pressed ? 0.85 : isSubmitting ? 0.5 : 1 },
              ]}
            >
              <StyledText variant="labelLarge" style={{ fontFamily: "BarlowMedium" }}>
                Close
              </StyledText>
            </Pressable>
            <Pressable
              onPress={() => void submit()}
              disabled={!canSubmit || isSubmitting}
              style={({ pressed }) => [
                styles.primary,
                {
                  backgroundColor: primary,
                  opacity: pressed ? 0.9 : !canSubmit || isSubmitting ? 0.5 : 1,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <StyledText
                  variant="labelLarge"
                  style={{ color: "#FFFFFF", fontFamily: "BarlowMedium" }}
                >
                  Reassign crew
                </StyledText>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28,
    maxHeight: "92%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  blockLabel: {
    marginTop: 12,
    marginBottom: 8,
  },
  reasonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  notesInput: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: "top",
  },
  candidatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
  },
  candidateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  candidateText: {
    flex: 1,
    gap: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  secondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  primary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
});