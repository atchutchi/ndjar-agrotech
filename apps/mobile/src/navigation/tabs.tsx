import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, spacing } from "../theme";

export type TabId = "home" | "map" | "doctor" | "forum" | "profile";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const tabs: { id: TabId; label: string; icon: IconName }[] = [
  { id: "home", label: "Inicio", icon: "home-variant-outline" },
  { id: "map", label: "Mapa", icon: "map-marker-radius-outline" },
  { id: "doctor", label: "Médico", icon: "stethoscope" },
  { id: "forum", label: "Forum", icon: "forum-outline" },
  { id: "profile", label: "Perfil", icon: "account-outline" },
];

export function BottomTabs({
  activeTab,
  onChange,
}: {
  activeTab: TabId;
  onChange: (tabId: TabId) => void;
}) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => [
              styles.tab,
              isActive ? styles.tabActive : null,
              pressed ? styles.tabPressed : null,
            ]}
          >
            <MaterialCommunityIcons
              color={isActive ? colors.surface : colors.textSecondary}
              name={tab.icon}
              size={22}
            />
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 14,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "space-between",
    left: 0,
    minHeight: 78,
    paddingBottom: 10,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    position: "absolute",
    right: 0,
    shadowColor: colors.shadow,
    shadowOffset: { height: -6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.surface,
  },
  tab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    gap: 3,
    minHeight: 58,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.brandPrimary,
  },
  tabPressed: {
    opacity: 0.72,
  },
});
