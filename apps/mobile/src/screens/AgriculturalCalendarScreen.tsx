import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  agriculturalCropGroups,
  agriculturalMonths,
  getCurrentAgriculturalMonthId,
  type AgriculturalCropGroup,
  type AgriculturalMonth,
  type AgriculturalMonthId,
  type AgriculturalPhase,
  type AgriculturalPhaseTone,
} from "../data/agriculturalCalendar";
import { Card, Chip, ScreenHeader } from "../components/ui";
import { colors, commonStyles, spacing, typography } from "../theme";

export function AgriculturalCalendarScreen({ onBack }: { onBack: () => void }) {
  const [selectedMonthId, setSelectedMonthId] = useState<AgriculturalMonthId>(
    getCurrentAgriculturalMonthId(),
  );
  const [selectedGroupId, setSelectedGroupId] = useState(
    agriculturalCropGroups[0].id,
  );

  const selectedMonth =
    agriculturalMonths.find((month) => month.id === selectedMonthId) ??
    agriculturalMonths[0];
  const selectedGroup =
    agriculturalCropGroups.find((group) => group.id === selectedGroupId) ??
    agriculturalCropGroups[0];

  const activeTasks = useMemo(
    () => getActiveTasks(selectedMonthId),
    [selectedMonthId],
  );
  const selectedGroupActivePhases = selectedGroup.phases.filter((phase) =>
    phase.months.includes(selectedMonthId),
  );

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        action={<Chip label="Livre" />}
        onBack={onBack}
        subtitle="Tabela agrícola interactiva extraída do calendário N'djar."
        title="Calendário"
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                color={colors.brandPrimary}
                name="calendar-month-outline"
                size={28}
              />
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={typography.sectionTitle}>{selectedMonth.label}</Text>
              <Text style={typography.secondary}>
                {selectedMonth.season === "rain"
                  ? "Época de chuva"
                  : "Época de seca"}
              </Text>
            </View>
            <Chip
              label={`${activeTasks.length} tarefas`}
              tone={activeTasks.length > 0 ? "warning" : "primary"}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.monthScroller}
          >
            <View style={styles.monthRow}>
              {agriculturalMonths.map((month) => (
                <MonthPill
                  key={month.id}
                  month={month}
                  selected={month.id === selectedMonthId}
                  onPress={() => setSelectedMonthId(month.id)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Agora neste mês</Text>
          {activeTasks.length > 0 ? (
            activeTasks.map((task) => (
              <View
                key={`${task.group.id}-${task.phase.id}`}
                style={styles.taskRow}
              >
                <View
                  style={[
                    styles.taskDot,
                    { backgroundColor: getPhaseColor(task.phase.tone) },
                  ]}
                />
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text style={typography.label}>{task.phase.label}</Text>
                  <Text style={typography.secondary}>
                    {task.group.title}: {task.group.crops.join(", ")}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                color={colors.textSecondary}
                name="calendar-search"
                size={24}
              />
              <Text style={typography.secondary}>
                Não há actividade marcada neste mês para os grupos completos.
              </Text>
            </View>
          )}
        </View>
      </Card>

      <View style={styles.groupGrid}>
        {agriculturalCropGroups.map((group) => (
          <CropGroupTile
            key={group.id}
            group={group}
            selected={group.id === selectedGroupId}
            selectedMonthId={selectedMonthId}
            onPress={() => setSelectedGroupId(group.id)}
          />
        ))}
      </View>

      <Card>
        <View style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <View style={styles.detailTitleRow}>
              <Text style={typography.sectionTitle}>{selectedGroup.title}</Text>
              <Chip
                label={
                  selectedGroup.status === "complete"
                    ? "Com meses"
                    : "A completar"
                }
                tone={
                  selectedGroup.status === "complete" ? "primary" : "warning"
                }
              />
            </View>
            <Text style={typography.secondary}>
              {selectedGroup.crops.join(", ")}
            </Text>
          </View>

          <View style={styles.monthGrid}>
            {agriculturalMonths.map((month) => (
              <View
                key={month.id}
                style={[
                  styles.gridMonth,
                  month.id === selectedMonthId
                    ? styles.gridMonthSelected
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.gridMonthText,
                    month.id === selectedMonthId
                      ? styles.gridMonthTextSelected
                      : null,
                  ]}
                >
                  {month.shortLabel}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ gap: spacing.md }}>
            {selectedGroup.phases.map((phase) => (
              <PhaseRow
                key={phase.id}
                phase={phase}
                selectedMonthId={selectedMonthId}
              />
            ))}
          </View>

          <View style={styles.noteBox}>
            <MaterialCommunityIcons
              color={colors.soil}
              name="information-outline"
              size={20}
            />
            <Text style={typography.secondary}>{selectedGroup.notes}</Text>
          </View>

          {selectedGroupActivePhases.length > 0 ? (
            <View style={styles.actionBox}>
              <Text style={styles.actionTitle}>Acção recomendada agora</Text>
              <Text style={typography.body}>
                Em {selectedMonth.label}, acompanha{" "}
                {selectedGroupActivePhases
                  .map((phase) => phase.label.toLowerCase())
                  .join(" e ")}{" "}
                para {selectedGroup.title.toLowerCase()}.
              </Text>
            </View>
          ) : (
            <View style={styles.actionBoxMuted}>
              <Text style={styles.actionTitle}>Sem tarefa marcada</Text>
              <Text style={typography.body}>
                Este grupo não tem actividade marcada em {selectedMonth.label}.
                Usa a tabela para planear o próximo período.
              </Text>
            </View>
          )}
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={typography.sectionTitle}>Legenda</Text>
          <LegendItem label="Preparação da terra" tone="soil" />
          <LegendItem label="Plantação" tone="planting" />
          <LegendItem label="Capinação e cuidados" tone="care" />
          <LegendItem label="Colheita" tone="harvest" />
          <LegendItem label="Debulha e pós-colheita" tone="postHarvest" />
          <LegendItem label="Dados por completar" tone="pending" />
        </View>
      </Card>
    </ScrollView>
  );
}

function MonthPill({
  month,
  selected,
  onPress,
}: {
  month: AgriculturalMonth;
  selected: boolean;
  onPress: () => void;
}) {
  const toneColor = month.season === "rain" ? colors.brandPrimary : colors.soil;

  return (
    <Pressable
      accessibilityLabel={month.label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.monthPill,
        selected
          ? { backgroundColor: toneColor, borderColor: toneColor }
          : { borderColor: `${toneColor}44` },
        pressed ? { opacity: 0.78 } : null,
      ]}
    >
      <Text
        style={[
          styles.monthPillText,
          selected ? { color: colors.surface } : { color: toneColor },
        ]}
      >
        {month.shortLabel}
      </Text>
      <View
        style={[
          styles.seasonDot,
          { backgroundColor: selected ? colors.surface : toneColor },
        ]}
      />
    </Pressable>
  );
}

function CropGroupTile({
  group,
  selected,
  selectedMonthId,
  onPress,
}: {
  group: AgriculturalCropGroup;
  selected: boolean;
  selectedMonthId: AgriculturalMonthId;
  onPress: () => void;
}) {
  const activeCount = group.phases.filter((phase) =>
    phase.months.includes(selectedMonthId),
  ).length;

  return (
    <Pressable
      accessibilityLabel={group.title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.groupTile,
        selected ? styles.groupTileSelected : null,
        pressed ? { opacity: 0.76 } : null,
      ]}
    >
      <View style={styles.groupIcon}>
        <MaterialCommunityIcons
          color={selected ? colors.surface : colors.brandPrimary}
          name={activeCount > 0 ? "sprout-outline" : "seed-outline"}
          size={24}
        />
      </View>
      <Text
        style={[styles.groupTitle, selected ? styles.groupTitleSelected : null]}
      >
        {group.title}
      </Text>
      <Text
        style={[styles.groupMeta, selected ? styles.groupMetaSelected : null]}
      >
        {activeCount > 0
          ? `${activeCount} fase${activeCount > 1 ? "s" : ""} activa`
          : group.status === "complete"
            ? "Sem tarefa agora"
            : "A completar"}
      </Text>
    </Pressable>
  );
}

function PhaseRow({
  phase,
  selectedMonthId,
}: {
  phase: AgriculturalPhase;
  selectedMonthId: AgriculturalMonthId;
}) {
  const phaseColor = getPhaseColor(phase.tone);

  return (
    <View style={styles.phaseRow}>
      <View style={styles.phaseHeader}>
        <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
        <Text style={typography.label}>{phase.label}</Text>
      </View>
      <View style={styles.phaseCells}>
        {agriculturalMonths.map((month) => {
          const isActive = phase.months.includes(month.id);
          const isSelected = month.id === selectedMonthId;

          return (
            <View
              key={month.id}
              style={[
                styles.phaseCell,
                isActive ? { backgroundColor: phaseColor } : null,
                isSelected ? styles.phaseCellSelected : null,
              ]}
            >
              {isActive ? (
                <Text style={styles.phaseCellText}>{month.shortLabel[0]}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
      {phase.months.length === 0 ? (
        <Text style={styles.pendingText}>Sem mês marcado no ficheiro.</Text>
      ) : null}
    </View>
  );
}

function LegendItem({
  label,
  tone,
}: {
  label: string;
  tone: AgriculturalPhaseTone;
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[styles.legendSwatch, { backgroundColor: getPhaseColor(tone) }]}
      />
      <Text style={typography.secondary}>{label}</Text>
    </View>
  );
}

function getActiveTasks(monthId: AgriculturalMonthId) {
  return agriculturalCropGroups.flatMap((group) =>
    group.phases
      .filter((phase) => phase.months.includes(monthId))
      .map((phase) => ({ group, phase })),
  );
}

function getPhaseColor(tone: AgriculturalPhaseTone) {
  if (tone === "soil") {
    return colors.soil;
  }

  if (tone === "planting") {
    return colors.brandPrimary;
  }

  if (tone === "care") {
    return colors.warning;
  }

  if (tone === "harvest") {
    return "#E56B2E";
  }

  if (tone === "postHarvest") {
    return colors.community;
  }

  return colors.textSecondary;
}

const styles = StyleSheet.create({
  actionBox: {
    backgroundColor: colors.mutedSurface,
    borderColor: `${colors.brandPrimary}33`,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  actionBoxMuted: {
    backgroundColor: "#F3F1EC",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  detailTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.mutedSurface,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  gridMonth: {
    alignItems: "center",
    backgroundColor: colors.mutedSurface,
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
  },
  gridMonthSelected: {
    backgroundColor: colors.brandPrimary,
  },
  gridMonthText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  gridMonthTextSelected: {
    color: colors.surface,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  groupIcon: {
    alignItems: "center",
    backgroundColor: `${colors.brandPrimary}14`,
    borderRadius: 999,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  groupMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  groupMetaSelected: {
    color: "#DDEEDD",
  },
  groupTile: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    flexBasis: "47.7%",
    gap: spacing.sm,
    minHeight: 148,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  groupTileSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  groupTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  groupTitleSelected: {
    color: colors.surface,
  },
  heroIcon: {
    alignItems: "center",
    backgroundColor: colors.mutedSurface,
    borderRadius: 999,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  heroTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  legendSwatch: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  monthPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  monthPillText: {
    fontSize: 13,
    fontWeight: "900",
  },
  monthRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  monthScroller: {
    marginHorizontal: -spacing.xs,
  },
  noteBox: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceWarm,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  pendingText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
  },
  phaseCell: {
    backgroundColor: colors.mutedSurface,
    borderRadius: 6,
    flex: 1,
    height: 22,
    justifyContent: "center",
    minWidth: 17,
  },
  phaseCellSelected: {
    borderColor: colors.ink,
    borderWidth: 2,
  },
  phaseCellText: {
    color: colors.surface,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
  phaseCells: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  phaseDot: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  phaseHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  phaseRow: {
    gap: spacing.sm,
  },
  seasonDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  taskDot: {
    borderRadius: 999,
    height: 14,
    width: 14,
  },
  taskRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
});
