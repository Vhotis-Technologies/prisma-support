import { useFonts } from "expo-font";

/**
 * Custom hook to load the fonts for the application
 * @returns boolean
 */
export const useLoadedFonts = () => {
  const [fontsLoaded] = useFonts({
    BarlowRegular: require("@/assets/fonts/Barlow-Regular.ttf"),
    BarlowLight: require("@/assets/fonts/Barlow-Light.ttf"),
    BarlowMedium: require("@/assets/fonts/Barlow-Medium.ttf"),
    RobotoRegular: require("@/assets/fonts/Roboto-Regular.ttf"),
    RobotoMedium: require("@/assets/fonts/Roboto-Medium.ttf"),
  });
  return fontsLoaded;
};
