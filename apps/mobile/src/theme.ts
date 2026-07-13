import { StyleSheet } from "react-native";

export const colors = {
  brandDark: "#092E1B",
  brandPrimary: "#1F6B35",
  action: "#247C37",
  soft: "#CFE1CC",
  background: "#F6F8F1",
  surface: "#FFFFFF",
  surfaceWarm: "#FFF7E8",
  textPrimary: "#183B24",
  textSecondary: "#636560",
  border: "#DDE5DA",
  warning: "#F49F0E",
  danger: "#D94132",
  soil: "#7A3B22",
  community: "#2E63E6",
  sky: "#DDEDFC",
  ink: "#122017",
  mutedSurface: "#ECF5E8",
  shadow: "#0B2816",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = StyleSheet.create({
  eyebrow: {
    color: colors.brandPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 25,
  },
  body: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  secondary: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
});

export const commonStyles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.action,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.mutedSurface,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    color: colors.brandPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
