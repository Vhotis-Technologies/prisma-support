import { useMemo } from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { DrawerStackHeaderLeft } from "@/app/components/navigation/DrawerStackHeaderLeft";
import { DrawerStackHeaderRight } from "@/app/components/navigation/DrawerStackHeaderRight";
import { useThemeColor } from "@/hooks/useThemeColor";

/**
 * Drawer menu always on the left; step back on the far right when the stack has history.
 */
export function useDrawerStackScreenOptions(): NativeStackNavigationOptions {
  const backgroundColor = useThemeColor({}, "background");
  const tintColor = useThemeColor({}, "tint");
  const borderColor = useThemeColor({}, "borders");

  return useMemo(
    () => ({
      headerShown: true,
      headerStyle: {
        backgroundColor,
        borderBottomWidth: 5,
        borderBottomColor: "red",
      },
      headerTintColor: tintColor,
      headerTitleStyle: { fontFamily: "BarlowMedium", fontSize: 18 },
      headerLeft: () => <DrawerStackHeaderLeft />,
      headerRight: () => <DrawerStackHeaderRight />,
    }),
    [backgroundColor, borderColor, tintColor],
  );
}
