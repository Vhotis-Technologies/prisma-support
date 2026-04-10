import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardGreeting() {
  const muted = useThemeColor(
    { light: "#757575", dark: "#9E9E9E" },
    "text"
  );
  const { title, subtitle } = useMemo(() => {
    const now = new Date();
    return {
      title: greetingForHour(now.getHours()),
      subtitle: now.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  }, []);

  return (
    <View style={styles.wrap}>
      <StyledText variant="headlineSmall" style={styles.title}>
        {title}
      </StyledText>
      <StyledText variant="bodyMedium" color={muted}>
        {subtitle}
      </StyledText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  title: {
    fontFamily: "BarlowMedium",
  },
});
