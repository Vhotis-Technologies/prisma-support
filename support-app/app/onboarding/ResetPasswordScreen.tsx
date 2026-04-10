import StyledText from "@/app/components/helpers/StyledText";
import StyledTextInput from "@/app/components/helpers/StyledTextInput";
import StyledButton from "@/app/components/helpers/StyledButton";
import LinearGradientComponent from "@/app/components/helpers/LinearGradientComponent";
import { useAlertContext } from "@/app/contexts/AlertContext";
import {
  useResetPasswordMutation,
  useValidateResetTokenMutation,
} from "@/app/store/api/authApi";
import {
  persistAuthTokens,
  persistAuthUser,
} from "@/app/store/authTokens";
import { useAppDispatch } from "@/app/store/main_store";
import { setSession } from "@/app/store/slices/authSlice";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const ResetPasswordScreen = () => {
  const { token } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const { setAlertConfig } = useAlertContext();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "borders");
  const primaryColor = useThemeColor({}, "primary");
  const cardColor = useThemeColor({}, "cards");

  const [validateResetToken] = useValidateResetTokenMutation();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setAlertConfig({
          isVisible: true,
          title: "Invalid link",
          message: "This password reset link is invalid.",
          type: "error",
          onConfirm: () => router.replace("/onboarding/SigninScreen"),
        });
        return;
      }

      try {
        const response = await validateResetToken({
          token: token as string,
        }).unwrap();

        if (response.valid) {
          setTokenValid(true);
          setUserEmail(response.user_email);
        } else {
          throw new Error("Invalid token");
        }
      } catch (error: unknown) {
        console.error("Token validation error:", error);

        let errorMessage = "This password reset link is invalid or expired.";
        if (
          error &&
          typeof error === "object" &&
          "data" in error &&
          typeof (error as { data?: { error?: string } }).data?.error ===
            "string"
        ) {
          errorMessage = (error as { data: { error: string } }).data.error;
        }

        setAlertConfig({
          isVisible: true,
          title: "Invalid link",
          message: errorMessage,
          type: "error",
          onConfirm: () => router.replace("/onboarding/SigninScreen"),
        });
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token, validateResetToken, setAlertConfig]);

  const validatePassword = (value: string): string | null => {
    if (value.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(value)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!password.trim()) {
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: "Please enter a new password",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    if (!confirmPassword.trim()) {
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: "Please confirm your password",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    if (password !== confirmPassword) {
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: "Passwords do not match",
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: passwordError,
        type: "error",
        onConfirm: () => {},
      });
      return;
    }

    try {
      const response = await resetPassword({
        token: token as string,
        password: password.trim(),
      }).unwrap();

      dispatch(
        setSession({
          access: response.access,
          refresh: response.refresh,
          user: response.user,
        }),
      );
      await persistAuthTokens(response.access, response.refresh);
      await persistAuthUser(response.user);

      setAlertConfig({
        isVisible: true,
        title: "Success",
        message:
          "Your password has been reset. You are signed in and can continue.",
        type: "success",
        onConfirm: () => {
          router.replace("/main/dashboard/DashboardScreen");
        },
      });
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      const msg =
        error &&
        typeof error === "object" &&
        "data" in error &&
        typeof (error as { data?: { error?: string } }).data?.error === "string"
          ? (error as { data: { error: string } }).data.error
          : "Failed to reset password";
      setAlertConfig({
        isVisible: true,
        title: "Error",
        message: msg,
        type: "error",
        onConfirm: () => {},
      });
    }
  };

  if (isValidatingToken) {
    return (
      <LinearGradientComponent
        color1={backgroundColor}
        color2={primaryColor}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 4, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <StyledText
            variant="bodyMedium"
            style={[styles.loadingText, { color: textColor }]}
          >
            Validating reset link…
          </StyledText>
        </View>
      </LinearGradientComponent>
    );
  }

  if (!tokenValid) {
    return null;
  }

  return (
    <LinearGradientComponent
      color1={backgroundColor}
      color2={primaryColor}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 4, y: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <StyledText
            variant="titleLarge"
            style={[styles.title, { color: textColor }]}
          >
            Reset password
          </StyledText>
          <StyledText
            variant="bodyMedium"
            style={[styles.subtitle, { color: textColor }]}
          >
            Enter your new password for {userEmail}
          </StyledText>
        </View>

        <View
          style={[
            styles.formContainer,
            { backgroundColor: cardColor, borderColor },
          ]}
        >
          <View style={styles.passwordContainer}>
            <StyledTextInput
              label="New password"
              placeholder="Enter your new password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, styles.passwordInput]}
            />
            <TouchableOpacity
              style={[styles.eyeIcon, { borderColor }]}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={textColor}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <StyledTextInput
              label="Confirm password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, styles.passwordInput]}
            />
            <TouchableOpacity
              style={[styles.eyeIcon, { borderColor }]}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color={textColor}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.requirementsCard,
              { backgroundColor, borderColor },
            ]}
          >
            <StyledText
              variant="bodySmall"
              style={[styles.requirementsTitle, { color: textColor }]}
            >
              Password requirements
            </StyledText>
            <StyledText
              variant="bodySmall"
              style={[styles.requirement, { color: textColor }]}
            >
              • At least 8 characters
            </StyledText>
            <StyledText
              variant="bodySmall"
              style={[styles.requirement, { color: textColor }]}
            >
              • Uppercase and lowercase letters
            </StyledText>
            <StyledText
              variant="bodySmall"
              style={[styles.requirement, { color: textColor }]}
            >
              • At least one number
            </StyledText>
          </View>

          <StyledButton
            variant="small"
            onPress={handleResetPassword}
            disabled={isLoading}
            style={styles.resetButton}
            title={isLoading ? "Resetting…" : "Reset password"}
          />
        </View>
      </ScrollView>
    </LinearGradientComponent>
  );
};

export default ResetPasswordScreen;

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.8,
  },
  formContainer: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 8,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: "absolute",
    right: 8,
    top: 26,
    padding: 8,
  },
  requirementsCard: {
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  requirement: {
    marginBottom: 4,
    opacity: 0.85,
  },
  resetButton: {
    width: "100%",
  },
});
