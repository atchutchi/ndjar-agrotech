import type { PropsWithChildren, ReactNode } from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, commonStyles, spacing, typography } from "../theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  action,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerBrand}>
          {onBack ? (
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              onPress={onBack}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                color={colors.brandPrimary}
                name="arrow-left"
                size={22}
              />
            </Pressable>
          ) : null}
          <Text style={typography.eyebrow}>N'djar</Text>
        </View>
        {action}
      </View>
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
  const toneColor = getToneColor(tone);

  return (
    <View style={[commonStyles.chip, { backgroundColor: `${toneColor}18` }]}>
      <Text style={[commonStyles.chipText, { color: toneColor }]}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onPress()}
      style={({ pressed }) => [
        commonStyles.button,
        pressed ? { opacity: 0.82 } : null,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon ? (
          <MaterialCommunityIcons
            color={colors.surface}
            name={icon}
            size={18}
          />
        ) : null}
        <Text style={commonStyles.buttonText}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => onPress()}
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed ? { opacity: 0.76 } : null,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon ? (
          <MaterialCommunityIcons
            color={colors.brandPrimary}
            name={icon}
            size={18}
          />
        ) : null}
        <Text style={styles.secondaryButtonText}>{label}</Text>
      </View>
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
  const valueColor = getToneColor(tone);

  return (
    <View style={styles.metricCard}>
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
  icon,
  onPress,
}: {
  title: string;
  meta: string;
  right?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
}) {
  const content = (
    <>
      {icon ? (
        <View style={styles.listIcon}>
          <MaterialCommunityIcons
            color={colors.brandPrimary}
            name={icon}
            size={22}
          />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={typography.label}>{title}</Text>
        <Text style={typography.secondary}>{meta}</Text>
      </View>
      {right}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        onPress={() => onPress()}
        style={({ pressed }) => [
          styles.listItem,
          pressed ? styles.pressedItem : null,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.listItem}>{content}</View>;
}

export function PhotoCard({
  image,
  title,
  subtitle,
  children,
}: PropsWithChildren<{
  image: number;
  title: string;
  subtitle: string;
}>) {
  return (
    <ImageBackground
      imageStyle={styles.photoImage}
      resizeMode="cover"
      source={image}
      style={styles.photoCard}
    >
      <View style={styles.photoScrim}>
        <Text style={styles.photoTitle}>{title}</Text>
        <Text style={styles.photoSubtitle}>{subtitle}</Text>
        {children}
      </View>
    </ImageBackground>
  );
}

export function IconMetric({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: IconName;
  label: string;
  value: string;
  tone?: "primary" | "warning" | "danger" | "soil" | "community";
}) {
  const toneColor = getToneColor(tone);

  return (
    <View style={styles.iconMetric}>
      <View style={[styles.metricIcon, { backgroundColor: `${toneColor}18` }]}>
        <MaterialCommunityIcons color={toneColor} name={icon} size={22} />
      </View>
      <Text style={[typography.sectionTitle, { color: toneColor }]}>
        {value}
      </Text>
      <Text style={typography.secondary}>{label}</Text>
    </View>
  );
}

function getToneColor(
  tone: "primary" | "warning" | "danger" | "soil" | "community",
) {
  if (tone === "warning") {
    return colors.warning;
  }

  if (tone === "danger") {
    return colors.danger;
  }

  if (tone === "soil") {
    return colors.soil;
  }

  if (tone === "community") {
    return colors.community;
  }

  return colors.brandPrimary;
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  header: {
    gap: spacing.xs,
  },
  headerBrand: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconMetric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 112,
    padding: spacing.md,
  },
  listIcon: {
    alignItems: "center",
    backgroundColor: colors.mutedSurface,
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  listItem: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 68,
    padding: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    flex: 1,
    gap: spacing.xs,
    minHeight: 100,
    padding: spacing.md,
  },
  metricIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  photoCard: {
    borderRadius: 8,
    minHeight: 252,
    overflow: "hidden",
  },
  photoImage: {
    borderRadius: 8,
  },
  photoScrim: {
    backgroundColor: "rgba(8, 34, 18, 0.48)",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  photoSubtitle: {
    color: "#E9F3E5",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  photoTitle: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 32,
  },
  pressedItem: {
    opacity: 0.72,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.brandPrimary,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.brandPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
});
