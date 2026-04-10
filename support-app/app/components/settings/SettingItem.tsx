/**
 * Setting row: title, description, theme-aware toggle (matches client settings).
 */
import React from "react";
import { StyleSheet, View } from "react-native";
import ToggleComponent from "@/app/components/helpers/ToggleComponent";
import { useThemeColor } from "@/hooks/useThemeColor";
import StyledText from "@/app/components/helpers/StyledText";

interface SettingItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const SettingItem = ({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}: SettingItemProps) => {
  return (
    <View
      style={[
        styles.settingItem,
        { borderBottomColor: useThemeColor({}, "borders") },
      ]}
    >
      <View style={styles.settingTextContainer}>
        <StyledText variant="labelLarge">{title}</StyledText>
        <StyledText variant="bodySmall" style={styles.settingDescription}>
          {description}
        </StyledText>
      </View>
      <ToggleComponent
        label=""
        value={value}
        onValueChange={onValueChange}
        size="small"
        disabled={disabled}
      />
    </View>
  );
};

export default SettingItem;

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingDescription: {
    fontSize: 10,
    lineHeight: 18,
  },
});
