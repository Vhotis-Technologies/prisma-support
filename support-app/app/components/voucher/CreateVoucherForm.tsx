import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, View, Switch } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { Ionicons } from "@expo/vector-icons";
import type { CreateVoucherBody } from "@/app/store/api/voucherApi";
import StyledText from "@/app/components/helpers/StyledText";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import StyledButton from "@/app/components/helpers/StyledButton";
import { useThemeColor } from "@/hooks/useThemeColor";

export type CreateVoucherFormProps = {
  onCreate: (body: CreateVoucherBody) => Promise<void>;
  onSuccess: () => void;
};

function formatPickerLabel(d: Date | undefined): string {
  if (!d) return "Tap to choose date (optional)";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Store calendar date at midday UTC so the intended local day is preserved in ISO. */
function dateToStoredIso(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  return new Date(Date.UTC(y, m, day, 12, 0, 0)).toISOString();
}

function apiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const d = (err as { data?: { error?: string; detail?: string } }).data;
    if (d?.error && typeof d.error === "string") return d.error;
    if (d?.detail && typeof d.detail === "string") return d.detail;
  }
  if (err instanceof Error) return err.message;
  return "Could not create voucher.";
}

function DatePickerField({
  label,
  value,
  info,
  onPress,
  onClear,
  borderColor,
  textColor,
  mutedColor,
  iconColor,
  primaryColor,
}: {
  label: string;
  value: Date | undefined;
  info?: string;
  onPress: () => void;
  onClear: () => void;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  iconColor: string;
  primaryColor: string;
}) {
  return (
    <View style={styles.dateBlock}>
      <StyledText
        variant="labelMedium"
        style={[styles.dateLabel, { color: textColor }]}
      >
        {label}
      </StyledText>
      <View style={styles.dateRow}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.dateInput,
            {
              borderColor,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="calendar-outline" size={20} color={iconColor} />
          <StyledText
            variant="bodyMedium"
            style={[
              styles.dateInputText,
              { color: value ? textColor : mutedColor },
            ]}
          >
            {formatPickerLabel(value)}
          </StyledText>
        </Pressable>
        {value ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
            <StyledText variant="labelSmall" style={{ color: primaryColor }}>
              Clear
            </StyledText>
          </Pressable>
        ) : null}
      </View>
      {info ? (
        <StyledText variant="bodySmall" color={mutedColor} style={styles.dateInfo}>
          {info}
        </StyledText>
      ) : null}
    </View>
  );
}

export default function CreateVoucherForm({
  onCreate,
  onSuccess,
}: CreateVoucherFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [credit, setCredit] = useState("");
  const [validFromDate, setValidFromDate] = useState<Date | undefined>(undefined);
  const [expiresDate, setExpiresDate] = useState<Date | undefined>(undefined);
  const [validFromOpen, setValidFromOpen] = useState(false);
  const [expiresOpen, setExpiresOpen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );
  const text = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const iconColor = useThemeColor({}, "icons");
  const primaryColor = useThemeColor({}, "primary");

  const onSubmit = useCallback(async () => {
    setError(null);
    const e = email.trim().toLowerCase();
    const c = code.trim().toUpperCase();
    const cr = credit.trim();
    if (!e || !c || !cr) {
      setError("Email, code, and credit amount are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(cr)) {
      setError("Credit must be a number (e.g. 50 or 50.00).");
      return;
    }

    const validFrom = validFromDate ? dateToStoredIso(validFromDate) : null;
    const expiresAt = expiresDate ? dateToStoredIso(expiresDate) : null;

    const body: CreateVoucherBody = {
      code: c,
      assigned_email: e,
      credit_amount: cr,
      is_active: isActive,
    };
    if (validFrom) body.valid_from = validFrom;
    if (expiresAt) body.expires_at = expiresAt;

    setIsSubmitting(true);
    try {
      await onCreate(body);
      onSuccess();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    email,
    code,
    credit,
    validFromDate,
    expiresDate,
    isActive,
    onCreate,
    onSuccess,
  ]);

  return (
    <View style={styles.wrap}>
      <StyledText variant="bodySmall" color={textMuted} style={styles.hint}>
        Winner vouchers are linked when the customer signs up with this email, or
        immediately if an account with this email already exists. Codes must be
        unique.
      </StyledText>

      <StyledTextInput
        label="Assigned email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="winner@example.com"
        editable={!isSubmitting}
      />

      <StyledTextInput
        label="Voucher code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        placeholder="e.g. SUMMER2026"
        editable={!isSubmitting}
      />

      <StyledTextInput
        label="Credit amount (£)"
        value={credit}
        onChangeText={setCredit}
        keyboardType="decimal-pad"
        placeholder="e.g. 100"
        editable={!isSubmitting}
      />

      <DatePickerField
        label="Valid from (optional)"
        value={validFromDate}
        info="Leave unset for no start limit."
        onPress={() => setValidFromOpen(true)}
        onClear={() => setValidFromDate(undefined)}
        borderColor={borderColor}
        textColor={text}
        mutedColor={textMuted}
        iconColor={iconColor}
        primaryColor={primaryColor}
      />

      <DatePickerField
        label="Expires at (optional)"
        value={expiresDate}
        info="Leave unset for no expiry."
        onPress={() => setExpiresOpen(true)}
        onClear={() => setExpiresDate(undefined)}
        borderColor={borderColor}
        textColor={text}
        mutedColor={textMuted}
        iconColor={iconColor}
        primaryColor={primaryColor}
      />

      <DatePickerModal
        locale="en"
        mode="single"
        visible={validFromOpen}
        date={validFromDate}
        onDismiss={() => setValidFromOpen(false)}
        onConfirm={({ date }) => {
          setValidFromOpen(false);
          setValidFromDate(date ?? undefined);
        }}
      />

      <DatePickerModal
        locale="en"
        mode="single"
        visible={expiresOpen}
        date={expiresDate}
        onDismiss={() => setExpiresOpen(false)}
        onConfirm={({ date }) => {
          setExpiresOpen(false);
          setExpiresDate(date ?? undefined);
        }}
      />

      <View style={styles.switchRow}>
        <StyledText variant="labelMedium" style={{ color: text }}>
          Active
        </StyledText>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          disabled={isSubmitting}
        />
      </View>

      {error ? (
        <StyledText variant="bodySmall" style={styles.err}>
          {error}
        </StyledText>
      ) : null}

      <StyledButton
        title={isSubmitting ? "Creating…" : "Create voucher"}
        onPress={() => void onSubmit()}
        variant="large"
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14,
  },
  hint: {
    marginBottom: 4,
    lineHeight: 20,
  },
  dateBlock: {
    gap: 6,
  },
  dateLabel: {
    paddingHorizontal: 5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    minHeight: 46,
  },
  dateInputText: {
    flex: 1,
    fontFamily: "BarlowRegular",
    fontSize: 14,
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dateInfo: {
    paddingHorizontal: 5,
    fontSize: 11,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  err: {
    color: "#B91C1C",
  },
});
