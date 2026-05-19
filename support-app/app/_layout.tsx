import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { en, registerTranslation } from "react-native-paper-dates";
import ThemeProvider from "@/app/contexts/ThemeProvider";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/app/store/main_store";

registerTranslation("en", en);
import { Provider } from "react-native-paper";
import NotificationInitializer from "./services/NotificationInitializer";
import AuthContextProvider from "./contexts/AuthContextProvider";
import { AlertProvider } from "./contexts/AlertContext";
import ModalServiceProvider from "./contexts/ModalServiceProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <ReduxProvider store={store}>
      <Provider>
        <ThemeProvider>
          <ModalServiceProvider>
            <AlertProvider>
              <AuthContextProvider>
                <NotificationInitializer>
                  <SafeAreaProvider>
                    <GestureHandlerRootView style={styles.root}>
                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="main" />
                        <Stack.Screen name="onboarding" />
                        <Stack.Screen name="index" />
                      </Stack>
                    </GestureHandlerRootView>
                  </SafeAreaProvider>
                </NotificationInitializer>
              </AuthContextProvider>
            </AlertProvider>
          </ModalServiceProvider>
        </ThemeProvider>
      </Provider>
    </ReduxProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
