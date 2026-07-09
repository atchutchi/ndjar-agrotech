import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme";

export type TabId = "home" | "map" | "doctor" | "forum" | "profile";

const tabs: { id: TabId; label: string; shortLabel: string }[] = [
  { id: "home", label: "Inicio", shortLabel: "In" },
  { id: "map", label: "Mapa", shortLabel: "Mp" },
  { id: "doctor", label: "Medico", shortLabel: "Md" },
  { id: "forum", label: "Forum", shortLabel: "Fr" },
  { id: "profile", label: "Perfil", shortLabel: "Pf" },
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
              pressed ? styles.tabPressed : null,
            ]}
          >
            <View
              style={[
                styles.icon,
                isActive ? styles.iconActive : styles.iconInactive,
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  isActive ? styles.iconTextActive : styles.iconTextInactive,
                ]}
              >
                {tab.shortLabel}
              </Text>
            </View>
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
    flexDirection: "row",
    gap: 2,
    justifyContent: "space-between",
    left: 0,
    minHeight: 76,
    paddingBottom: 10,
    paddingHorizontal: 8,
    paddingTop: 8,
    position: "absolute",
    right: 0,
  },
  icon: {
    alignItems: "center",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  iconActive: {
    backgroundColor: colors.mutedSurface,
  },
  iconInactive: {
    backgroundColor: "transparent",
  },
  iconText: {
    fontSize: 11,
    fontWeight: "800",
  },
  iconTextActive: {
    color: colors.brandPrimary,
  },
  iconTextInactive: {
    color: colors.textSecondary,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.brandPrimary,
  },
  tab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    gap: 3,
    minHeight: 56,
    justifyContent: "center",
  },
  tabPressed: {
    opacity: 0.72,
  },
});
