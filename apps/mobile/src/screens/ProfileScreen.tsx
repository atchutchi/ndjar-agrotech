import { ScrollView, Text, View } from "react-native";

import type { Navigate } from "../App";
import {
  Card,
  Chip,
  ListItem,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
} from "../components/ui";
import type { PilotSnapshot } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

export function ProfileScreen({
  snapshot,
  navigate,
  onBack,
  canGoBack,
}: {
  snapshot: PilotSnapshot | null;
  navigate: Navigate;
  onBack: () => void;
  canGoBack: boolean;
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
        onBack={canGoBack ? onBack : undefined}
        title="Perfil"
        subtitle="Conta do piloto, idioma, dados locais e sincronização."
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View
              style={{
                alignItems: "center",
                backgroundColor: colors.brandPrimary,
                borderRadius: 999,
                height: 62,
                justifyContent: "center",
                width: 62,
              }}
            >
              <Text style={{ color: "white", fontSize: 19, fontWeight: "900" }}>
                BC
              </Text>
            </View>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <Text style={typography.sectionTitle}>Binta Cisse</Text>
              <Text style={typography.secondary}>Agricultora, Quinara</Text>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <Chip label="Português" />
                <Chip label="Demonstração local" tone="community" />
              </View>
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <ListItem
            icon="translate"
            meta="Português agora. Crioulo, Fula e Balanta ficam para fase seguinte."
            title="Idioma"
          />
          <ListItem
            icon="database-check-outline"
            meta="Dados de exemplo incluídos na aplicação. Não existe sincronização com servidor."
            title="Dados locais"
          />
          <ListItem
            icon="texture-box"
            meta={`${parcelCount ?? 0} parcelas estimadas no piloto`}
            title="Parcelas"
            onPress={() => navigate("root", undefined, "map")}
          />
          <ListItem
            icon="flask-outline"
            meta={`${sampleCount} amostra pH, marcada como exemplo`}
            title="Amostras"
            onPress={() => navigate("sample", undefined, "map")}
          />
          <ListItem
            icon="bell-outline"
            meta="Alertas de chuva, pragas e calendário entram depois da API real."
            title="Alertas"
          />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                icon="sync"
                label="Sem sincronização"
                disabled
                onPress={() => undefined}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                icon="logout"
                label="Sem sessão iniciada"
                disabled
                onPress={() => undefined}
              />
            </View>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
