import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";

type Props = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function DashboardSectionHeader({
  title,
  actionLabel,
  onActionPress,
}: Props) {
  const primary = useThemeColor({}, "primary");

  return (
    <View style={styles.row}>
      <StyledText variant="titleMedium" style={styles.title}>
        {title}
      </StyledText>
      {actionLabel && onActionPress ? (
        <Pressable onPress={onActionPress} hitSlop={8} style={styles.button}>
          <StyledText variant="labelLarge" style={{ color: primary }}>
            {actionLabel}
          </StyledText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    fontFamily: "BarlowMedium",
  },
  button: {
    paddingHorizontal: 16,
    borderRadius: 16,
  },
});
