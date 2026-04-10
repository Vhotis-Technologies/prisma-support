import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DashboardDataCardProps } from "../../interfaces/DashbordInterfaces";
import StyledText from "../helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/app/utils/methods";

const DashboardDataCardComponent = ({
  title,
  difference,
  value,
  isIncrease,
  icon,
}: DashboardDataCardProps) => {
    const primaryColor = useThemeColor({}, "primary") ;
    const iconColor = useThemeColor({}, "icons");
    const isRevue =
      title.trim().toLocaleLowerCase() === "revenue";
    const valueText = isRevue
      ? formatCurrency(value)
      : value.toLocaleString();

  return (
    <View style={[styles.card, { backgroundColor: primaryColor }]}>
      <View
        style={[
          styles.iconContainer,
          { borderColor: primaryColor },
        ]}
      >
        <Ionicons
          name={(icon as keyof typeof Ionicons.glyphMap) || (isIncrease ? "trending-up" : "trending-down")}
          size={18}
          color={iconColor}
        />
      </View>

      <StyledText style={[styles.title,]}>
        {title}
      </StyledText>

      <View style={styles.footer}>
        <StyledText
          style={[styles.value,]}
        >
          {valueText}
        </StyledText>
        <View style={styles.trendRow}>
          <Ionicons
            name={isIncrease ? "arrow-up" : "arrow-down"}
            size={14}
            color={iconColor}   
          />
          <StyledText
            style={[]}
          >
            {difference}
          </StyledText>
        </View>
      </View>
    </View>
  );
};

export default DashboardDataCardComponent;

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 8,
    padding:12,
    position: "relative",
    flex:1
  },
  iconContainer: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 40,
    height: 40,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "BarlowRegular",
    fontSize: 18,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  value: {
    fontFamily: "BarlowBold",
    fontSize: 30,
    lineHeight: 30,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 14,
  },
});