import StyledText from "@/app/components/helpers/StyledText";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import StyledButton from "@/app/components/helpers/StyledButton";
import { useAlertContext } from "@/app/contexts/AlertContext";
import { useRequestPasswordResetMutation } from "@/app/store/api/authApi";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { setAlertConfig } = useAlertContext();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const primaryColor = useThemeColor({}, "primary");
  const cardColor = useThemeColor({}, "cards");

  const [requestPasswordReset, { isLoading }] =
    useRequestPasswordResetMutation();

  const handleSendResetEmail = async () => {
    if (!email.trim()) {
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: "Please enter your email address",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: "Please enter a valid email address",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    try {
      const response = await requestPasswordReset({
        email: email.trim().toLowerCase(),
      }).unwrap();

      if (response.message) {
        setEmailSent(true);
      }
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      const msg =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { error?: string } }).data?.error === "string"
          ? (error as { data: { error: string } }).data.error
          : "Failed to send reset email";
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: msg,
        type: "error",
        onConfirm: () => {},
      });
    }
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="mail-outline" size={64} color={primaryColor} />
            <StyledText
              variant="titleLarge"
              style={[styles.title, { color: textColor }]}
            >
              Check your email
            </StyledText>
            <StyledText
              variant="bodyMedium"
              style={[styles.subtitle, { color: textColor }]}
            >
              We've sent a password reset link to {email}
            </StyledText>
          </View>

          <View
            style={[styles.card, { backgroundColor: cardColor, borderColor }]}
          >
            <StyledText
              variant="bodyMedium"
              style={[styles.cardText, { color: textColor }]}
            >
              Open the link in the message to set a new password on the web, or
              use "Open in app" if your device offers it. The link expires in 1
              hour.
            </StyledText>
          </View>

          <StyledButton
            variant="small"
            title="Back to sign in"
            onPress={() => router.replace("/onboarding/SigninScreen")}
            style={styles.resetButton}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <StyledText
            variant="titleLarge"
            style={[styles.title, { color: textColor }]}
          >
            Forgot password?
          </StyledText>
          <StyledText
            variant="bodySmall"
            style={[styles.subtitle, { color: textColor }]}
          >
            Enter your email and we'll send you a link to reset your password.
          </StyledText>
        </View>

        <View style={styles.formContainer}>
          <StyledTextInput
            label="Email address"
            placeholder="you@company.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <StyledButton
            variant="small"
            onPress={handleSendResetEmail}
            disabled={isLoading}
            style={styles.resetButton}
            title={isLoading ? "Sending…" : "Send reset link"}
          />

          <StyledButton
            variant="small"
            title="Back to sign in"
            onPress={() => router.back()}
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.75,
    lineHeight: 20,
  },
  formContainer: {
    gap: 12,
  },
  input: {
    marginBottom: 8,
    borderRadius: 12,
  },
  resetButton: {
    width: "100%",
  },
  secondaryButton: {
    width: "100%",
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardText: {
    lineHeight: 22,
  },
});
