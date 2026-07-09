import { ScrollView, Text, View } from "react-native";

import {
  Card,
  Chip,
  ListItem,
  PrimaryButton,
  ScreenHeader,
} from "../components/ui";
import type { PilotSnapshot } from "../storage/offlineStore";
import { commonStyles, spacing, typography } from "../theme";

export function ProfileScreen({
  snapshot,
}: {
  snapshot: PilotSnapshot | null;
}) {
  const parcelCount = snapshot?.communities.reduce(
    (total, community) =>
      total + Math.round(community.areaHectares / community.parcelSizeHectares),
    0,
  );
  const sampleCount = snapshot?.region.phSamples.length ?? 0;

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        title="Perfil"
        subtitle="Conta do piloto e estado dos dados locais."
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View
              style={{
                alignItems: "center",
                backgroundColor: "#2B8736",
                borderRadius: 999,
                height: 54,
                justifyContent: "center",
                width: 54,
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
                BC
              </Text>
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={typography.sectionTitle}>Binta Cisse</Text>
              <Text style={typography.secondary}>Agricultora, Quinara</Text>
              <Chip label="Snapshot demo" />
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <ListItem meta="Portugues" title="Idioma" />
          <ListItem
            meta="Dados piloto carregados localmente. API real fica para depois."
            title="Dados locais"
          />
          <ListItem
            meta={`${parcelCount ?? 0} parcelas estimadas no piloto`}
            title="Parcelas"
          />
          <ListItem
            meta={`${sampleCount} amostra pH, marcada como exemplo`}
            title="Amostras"
          />
          <PrimaryButton label="Sair" onPress={() => undefined} />
        </View>
      </Card>
    </ScrollView>
  );
}
