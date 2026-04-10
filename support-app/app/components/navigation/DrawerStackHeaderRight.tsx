import React from "react";
import { TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

/**
 * Back control on the far right; only visible when the stack can pop.
 */
export function DrawerStackHeaderRight() {
  const navigation = useNavigation();
  const tintColor = useThemeColor({}, "tint");
  const canGoBack = navigation.canGoBack();

  if (!canGoBack) {
    return <View style={{ width: 8 }} />;
  }

  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={{ marginRight: 4, padding: 8 }}
    >
      <MaterialIcons name="arrow-back" size={20} color={tintColor} />
    </TouchableOpacity>
  );
}
