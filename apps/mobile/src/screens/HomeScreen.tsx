import { ScrollView, Text, View } from "react-native";

import {
  Card,
  Chip,
  MetricCard,
  PrimaryButton,
  ScreenHeader,
} from "../components/ui";
import type { TabId } from "../navigation/tabs";
import type { PilotSnapshot } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

export function HomeScreen({
  snapshot,
  onOpenTab,
}: {
  snapshot: PilotSnapshot | null;
  onOpenTab: (tabId: TabId) => void;
}) {
  const regionLabel = snapshot
    ? `${snapshot.region.regionName} / ${snapshot.region.sectorName}`
    : "A carregar piloto";
  const phValue = snapshot ? snapshot.phExample.ph.toFixed(1) : "-";
  const cropCount = snapshot?.crops.length ?? 0;
  const communityCount = snapshot?.communities.length ?? 0;

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        title="Bom dia, Binta"
        subtitle="Painel operativo do piloto Quinara/Buba."
      />

      <View
        style={{
          backgroundColor: colors.brandDark,
          borderRadius: 8,
          gap: spacing.md,
          padding: spacing.lg,
        }}
      >
        <Text style={[typography.eyebrow, { color: colors.soft }]}>
          {regionLabel}
        </Text>
        <Text style={[typography.sectionTitle, { color: colors.surface }]}>
          pH {phValue} marcado como exemplo. Validar amostra antes de
          recomendar.
        </Text>
        <PrimaryButton label="Ver mapa" onPress={() => onOpenTab("map")} />
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <MetricCard
          label="pH solo"
          note="Exemplo, nao laboratorio"
          tone="warning"
          value={phValue}
        />
        <MetricCard
          label="Piloto"
          note={`${communityCount} comunidades`}
          value={`${cropCount}`}
        />
      </View>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Alertas prudentes</Text>
          <Chip label="pH exemplo" tone="warning" />
          <Text style={typography.body}>
            Nao usar este pH para dosagem, calagem ou decisao de produto. O dado
            serve apenas para demonstrar o fluxo.
          </Text>
          <Text style={typography.body}>
            Perguntas sobre produto, dose, mistura, colheita ou sintomas graves
            devem ir para consultor em 24h.
          </Text>
        </View>
      </Card>

      <View style={{ gap: spacing.md }}>
        <Text style={typography.sectionTitle}>Atalhos</Text>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}
        >
          <Shortcut label="Mapa" onPress={() => onOpenTab("map")} />
          <Shortcut label="Medico" onPress={() => onOpenTab("doctor")} />
          <Shortcut label="Forum" onPress={() => onOpenTab("forum")} />
          <Shortcut label="Perfil" onPress={() => onOpenTab("profile")} />
        </View>
      </View>
    </ScrollView>
  );
}

function Shortcut({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={{ minWidth: "47%", flexGrow: 1 }}>
      <PrimaryButton label={label} onPress={onPress} />
    </View>
  );
}
