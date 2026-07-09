import { ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import agriHero from "../../assets/ndjar-agri-realistic.png";
import type { Navigate } from "../App";
import {
  Card,
  Chip,
  IconMetric,
  ListItem,
  PhotoCard,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
} from "../components/ui";
import type { TabId } from "../navigation/tabs";
import type { PilotSnapshot } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

export function HomeScreen({
  snapshot,
  onOpenTab,
  navigate,
}: {
  snapshot: PilotSnapshot | null;
  onOpenTab: (tabId: TabId) => void;
  navigate: Navigate;
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
        subtitle="Painel do piloto sul, com dados prudentes para agricultura local."
      />

      <PhotoCard
        image={agriHero}
        subtitle={`${regionLabel}. Recomendações só depois de validar dados sensíveis.`}
        title="A terra certa para cada cultivo"
      >
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              icon="map-search-outline"
              label="Ver mapa"
              onPress={() => onOpenTab("map")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              icon="stethoscope"
              label="Consulta"
              onPress={() => onOpenTab("doctor")}
            />
          </View>
        </View>
      </PhotoCard>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <IconMetric
          icon="flask-outline"
          label="pH exemplo"
          tone="warning"
          value={phValue}
        />
        <IconMetric
          icon="sprout-outline"
          label={`${communityCount} comunidades`}
          value={`${cropCount} cultivos`}
        />
      </View>

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Chip label="Piloto Quinara" />
            <Chip label="Offline demo" tone="community" />
          </View>
          <Text style={typography.sectionTitle}>O que precisa de atenção</Text>
          <ListItem
            icon="alert-decagram-outline"
            meta="Não recomendar dose, calagem ou produto sem amostra validada."
            right={
              <MaterialCommunityIcons
                color={colors.warning}
                name="chevron-right"
                size={24}
              />
            }
            title="pH ainda é exemplo"
            onPress={() => navigate("sample", undefined, "map")}
          />
          <ListItem
            icon="calendar-clock"
            meta="Preparação, plantação, capinação e colheita por época."
            right={
              <MaterialCommunityIcons
                color={colors.brandPrimary}
                name="chevron-right"
                size={24}
              />
            }
            title="Calendário agrícola"
            onPress={() => navigate("calendar", undefined, "map")}
          />
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Acções rápidas</Text>
          <View style={{ gap: spacing.sm }}>
            <ListItem
              icon="map-marker-radius-outline"
              meta="Mapa real com ponto de Buba e comunidades estimadas."
              title="Explorar região"
              onPress={() => onOpenTab("map")}
            />
            <ListItem
              icon="leaf"
              meta="Ver culturas recomendadas para o piloto."
              title="Cultivos"
              onPress={() => navigate("crop", { cropId: "mandioca" }, "map")}
            />
            <ListItem
              icon="forum-outline"
              meta="Perguntas da comunidade com moderação prudente."
              title="Abrir fórum"
              onPress={() => onOpenTab("forum")}
            />
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
