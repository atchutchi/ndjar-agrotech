import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { colors, commonStyles, spacing, typography } from "../theme";

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={typography.eyebrow}>N'djar</Text>
      <Text style={typography.title}>{title}</Text>
      <Text style={typography.secondary}>{subtitle}</Text>
    </View>
  );
}

export function Card({ children }: PropsWithChildren) {
  return <View style={commonStyles.card}>{children}</View>;
}

export function Chip({
  label,
  tone = "primary",
}: {
  label: string;
  tone?: "primary" | "warning" | "danger" | "soil" | "community";
}) {
  const toneColor =
    tone === "warning"
      ? colors.warning
      : tone === "danger"
        ? colors.danger
        : tone === "soil"
          ? colors.soil
          : tone === "community"
            ? colors.community
            : colors.brandPrimary;

  return (
    <View style={[commonStyles.chip, { backgroundColor: `${toneColor}18` }]}>
      <Text style={[commonStyles.chipText, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        commonStyles.button,
        pressed ? { opacity: 0.82 } : null,
      ]}
    >
      <Text style={commonStyles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function MetricCard({
  label,
  value,
  note,
  tone = "primary",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "primary" | "warning" | "danger";
}) {
  const valueColor =
    tone === "warning"
      ? colors.warning
      : tone === "danger"
        ? colors.danger
        : colors.brandPrimary;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        gap: spacing.xs,
        minHeight: 96,
        padding: spacing.md,
      }}
    >
      <Text style={typography.secondary}>{label}</Text>
      <Text style={[typography.title, { color: valueColor, fontSize: 26 }]}>
        {value}
      </Text>
      <Text style={typography.secondary}>{note}</Text>
    </View>
  );
}

export function ListItem({
  title,
  meta,
  right,
}: {
  title: string;
  meta: string;
  right?: ReactNode;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: "row",
        gap: spacing.md,
        justifyContent: "space-between",
        minHeight: 58,
        padding: spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={typography.label}>{title}</Text>
        <Text style={typography.secondary}>{meta}</Text>
      </View>
      {right}
    </View>
  );
}
