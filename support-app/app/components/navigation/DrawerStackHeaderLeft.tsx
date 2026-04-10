import React from "react";
import { TouchableOpacity } from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

/**
 * Always opens the parent drawer so users can jump to another section from any depth.
 */
export function DrawerStackHeaderLeft() {
  const navigation = useNavigation();
  const tintColor = useThemeColor({}, "tint");

  const openDrawer = () => {
    const parent = navigation.getParent();
    if (parent) parent.dispatch(DrawerActions.openDrawer());
    else navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <TouchableOpacity
      onPress={openDrawer}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      style={{ marginLeft: -10, padding: 8, marginRight: 10 }}
    >
      <MaterialIcons name="menu" size={24} color={tintColor} />
    </TouchableOpacity>
  );
}
