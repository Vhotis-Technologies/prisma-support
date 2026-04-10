import { useOnboarding } from "@/app/app_hooks/useOnboarding";
import StyledText from "@/app/components/helpers/StyledText";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import { useAuthContext } from "@/app/contexts/AuthContextProvider";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "react-native-paper";

const SigninScreen = () => {
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const buttonBg = useThemeColor({}, "button");
  const buttonText = useThemeColor({}, "buttonText");
  const { navigateToSignUp } = useOnboarding();
  const { handleLogin } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await handleLogin(email, password, rememberMe);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <StyledText
            variant="titleLarge"
            style={[styles.heading, { color: textColor }]}
          >
            Sign in
          </StyledText>

          <StyledTextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@company.com"
          />
          <StyledTextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <View style={styles.rememberForgotRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.checkbox, { borderColor }]}>
                {rememberMe ? (
                  <Ionicons name="checkmark" size={16} color={textColor} />
                ) : null}
              </View>
              <StyledText
                variant="bodyMedium"
                style={[styles.rememberLabel, { color: textColor }]}
              >
                Remember me
              </StyledText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push("/onboarding/ForgotPasswordScreen" as Href)
              }
            >
              <StyledText
                variant="bodySmall"
                style={[styles.forgotPassword, { color: buttonBg }]}
              >
                Forgot password?
              </StyledText>
            </TouchableOpacity>
          </View>

          {submitting ? (
            <ActivityIndicator style={styles.spinner} />
          ) : (
            <Button
              mode="contained"
              onPress={onSubmit}
              style={{ backgroundColor: buttonBg, marginTop: 4 }}
              labelStyle={{ color: buttonText }}
            >
              Sign in
            </Button>
          )}
          <Button mode="text" onPress={navigateToSignUp} textColor={textColor}>
            Need an account? Sign up
          </Button>
          <Button mode="text" onPress={() => router.back()} textColor={textColor}>
            Back
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SigninScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  inner: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  rememberForgotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -4,
    marginBottom: 4,
    gap: 10,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  forgotPassword: {
    fontWeight: "600",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberLabel: { fontSize: 15 },
  spinner: { marginTop: 8 },
});
