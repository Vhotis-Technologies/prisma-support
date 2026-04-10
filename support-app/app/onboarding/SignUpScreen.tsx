import { useOnboarding } from "@/app/app_hooks/useOnboarding";
import StyledText from "@/app/components/helpers/StyledText";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import { useAlertContext } from "@/app/contexts/AlertContext";
import { useRegisterSupportMutation } from "@/app/store/api/authApi";
import {
  persistAuthTokens,
  persistAuthUser,
} from "@/app/store/authTokens";
import { useAppDispatch } from "@/app/store/main_store";
import { setSession } from "@/app/store/slices/authSlice";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, RadioButton, SegmentedButtons } from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";

function formatRegisterError(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data: unknown }).data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      if ("detail" in data && typeof (data as { detail: string }).detail === "string") {
        return (data as { detail: string }).detail;
      }
      if ("error" in data && typeof (data as { error: string }).error === "string") {
        return (data as { error: string }).error;
      }
      const entries = Object.entries(data as Record<string, string[]>)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
        .join("\n");
      if (entries) return entries;
    }
  }
  return "Registration failed. Check your details and try again.";
}

function formatDobLabel(d: Date | undefined): string {
  if (!d) return "Tap to choose date of birth";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** API expects YYYY-MM-DD */
function dateToIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SignUpScreen = () => {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonBg = useThemeColor({}, "button");
  const buttonText = useThemeColor({}, "buttonText");
  const borderColor = useThemeColor({}, "borders");
  const cardColor = useThemeColor({}, "cards");
  const iconColor = useThemeColor({}, "icons");
  const primaryColor = useThemeColor({}, "primary");
  const textMuted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text",
  );

  const dispatch = useAppDispatch();
  const { signUpRole, setSignUpRole } = useOnboarding();
  const { setAlertConfig, setIsVisible } = useAlertContext();
  const [registerSupport, { isLoading }] = useRegisterSupportMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [dobDate, setDobDate] = useState<Date | undefined>(undefined);
  const [dobPickerOpen, setDobPickerOpen] = useState(false);

  const roleButtons = useMemo(
    () => [
      { value: "support", label: "Support" },
      { value: "admin", label: "Admin" },
    ],
    [],
  );

  const canSubmit =
    signUpRole === "support" &&
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    password.length >= 8 &&
    (gender === "male" || gender === "female");

  const onSubmit = async () => {
    if (!canSubmit) return;
    if (gender !== "male" && gender !== "female") return;
    try {
      const result = await registerSupport({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender,
        ...(dobDate ? { dob: dateToIsoDate(dobDate) } : {}),
      }).unwrap();
      dispatch(
        setSession({
          access: result.access,
          refresh: result.refresh,
          user: result.user,
        }),
      );
      await persistAuthTokens(result.access, result.refresh);
      await persistAuthUser(result.user);
      router.replace("/main/dashboard/DashboardScreen" as Href);
    } catch (e) {
      setAlertConfig({
        isVisible: true,
        title: "Sign up failed",
        message: formatRegisterError(e),
        type: "error",
        onConfirm: () => setIsVisible(false),
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <StyledText variant="titleLarge" style={[styles.heading, { color: textColor }]}>
          Create account
        </StyledText>
        <StyledText variant="bodyMedium" style={[styles.caption, { color: textColor }]}>
          Public registration is available for Support roles only. Admin accounts are
          provisioned separately.
        </StyledText>

        <StyledText variant="labelMedium" style={[styles.label, { color: textColor }]}>
          Role
        </StyledText>
        <SegmentedButtons
          value={signUpRole ?? "support"}
          onValueChange={(v) =>
            setSignUpRole(v === "admin" || v === "support" ? v : null)
          }
          buttons={roleButtons}
          style={styles.segment}
        />

        {signUpRole === "admin" ? (
          <StyledText variant="bodyMedium" style={[styles.note, { color: textColor }]}>
            Admin access is not available through self-service signup. Contact your
            administrator to be invited.
          </StyledText>
        ) : null}

        <StyledTextInput
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          placeholder="First name"
        />
        <StyledTextInput
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          placeholder="Last name"
        />
        <StyledTextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@company.com"
        />
        <StyledTextInput
          label="Password (min 8 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <StyledText variant="labelMedium" style={[styles.label, { color: textColor }]}>
          Gender
        </StyledText>
        <RadioButton.Group
          onValueChange={(v) => setGender(v as "male" | "female")}
          value={gender}
        >
          <View style={styles.radioRow}>
            <RadioButton.Item
              label="Male"
              value="male"
              labelStyle={{ color: textColor }}
              color={primaryColor}
              style={styles.radioItem}
            />
            <RadioButton.Item
              label="Female"
              value="female"
              labelStyle={{ color: textColor }}
              color={primaryColor}
              style={styles.radioItem}
            />
          </View>
        </RadioButton.Group>

        <View style={styles.dateBlock}>
          <StyledText
            variant="labelMedium"
            style={[styles.dateLabel, { color: textColor }]}
          >
            Date of birth (optional)
          </StyledText>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setDobPickerOpen(true)}
              style={({ pressed }) => [
                styles.dateInput,
                {
                  borderColor,
                  backgroundColor: cardColor,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={20} color={iconColor} />
              <StyledText
                variant="bodyMedium"
                style={[
                  styles.dateInputText,
                  { color: dobDate ? textColor : textMuted },
                ]}
              >
                {formatDobLabel(dobDate)}
              </StyledText>
            </Pressable>
            {dobDate ? (
              <Pressable onPress={() => setDobDate(undefined)} hitSlop={8} style={styles.clearBtn}>
                <StyledText variant="labelSmall" style={{ color: primaryColor }}>
                  Clear
                </StyledText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <DatePickerModal
          locale="en"
          mode="single"
          visible={dobPickerOpen}
          date={dobDate}
          onDismiss={() => setDobPickerOpen(false)}
          onConfirm={({ date }) => {
            setDobPickerOpen(false);
            setDobDate(date ?? undefined);
          }}
        />

        <Button
          mode="contained"
          onPress={onSubmit}
          disabled={!canSubmit || isLoading}
          loading={isLoading}
          style={{ backgroundColor: buttonBg, marginTop: 8 }}
          labelStyle={{ color: buttonText }}
        >
          Create support account
        </Button>
        <Button mode="text" onPress={() => router.back()} textColor={textColor}>
          Back
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 0 },
  caption: { fontSize: 14, opacity: 0.9, marginBottom: 4 },
  label: { marginBottom: 0, fontWeight: "600" },
  segment: { marginBottom: 0 },
  note: { fontSize: 14, marginBottom: 0, opacity: 0.95 },
  radioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: -8,
  },
  radioItem: {
    flex: 1,
    minWidth: 140,
    paddingVertical: 0,
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
});
