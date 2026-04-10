import { KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeContext } from '../contexts/ThemeProvider';
import { Stack } from 'expo-router';

const OnboardingLayout = () => {
  const backgroundColor = useThemeColor({}, "background");
  const { currentTheme } = useThemeContext();
  const statusBarStyle = currentTheme === "dark" ? "light-content" : 
  "dark-content";
  return (
    <View style={styles.container}>
      <StatusBar barStyle={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignUpScreen" />
        <Stack.Screen name="SigninScreen" />
        <Stack.Screen name="ForgotPasswordScreen" />
        <Stack.Screen name="ResetPasswordScreen" />
      </Stack>
    </View>
  );    
};

export default OnboardingLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});