import { useOnboarding } from "@/app/app_hooks/useOnboarding";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { navigateToSignIn, navigateToSignUp } = useOnboarding();
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const buttonBg = useThemeColor({}, "button");
  const buttonText = useThemeColor({}, "buttonText");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]}>
      <View style={styles.inner}>
        <Text style={[styles.title, { color: textColor }]}>Support</Text>
        <Text style={[styles.subtitle, { color: textColor }]}>
          Sign in to your account or create a support staff profile.
        </Text>
        <Button
          mode="contained"
          onPress={navigateToSignIn}
          style={[styles.btn, { backgroundColor: buttonBg }]}
          labelStyle={{ color: buttonText }}
        >
          Sign in
        </Button>
        <Button
          mode="outlined"
          onPress={navigateToSignUp}
          style={styles.btn}
          textColor={textColor}
        >
          Sign up
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 15, opacity: 0.85, marginBottom: 16 },
  btn: { marginVertical: 4 },
});
