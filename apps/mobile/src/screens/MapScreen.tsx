import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { AppRoute, Navigate } from "../App";
import {
  Card,
  Chip,
  IconMetric,
  ListItem,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
} from "../components/ui";
import type { PilotSnapshot } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

const bubaCenter = {
  latitude: 11.58889,
  longitude: -14.99583,
};

const communityPoints = [
  { id: "sare-donha-1", latitude: 11.552, longitude: -15.034 },
  { id: "sare-donha-2", latitude: 11.567, longitude: -14.951 },
  { id: "uane", latitude: 11.627, longitude: -15.061 },
  { id: "ugui", latitude: 11.648, longitude: -14.925 },
];

const pilotPolygon = [
  { latitude: 11.535, longitude: -15.08 },
  { latitude: 11.67, longitude: -15.08 },
  { latitude: 11.695, longitude: -14.91 },
  { latitude: 11.535, longitude: -14.9 },
];

const cropPhRanges: Record<string, string> = {
  arroz: "5.5-7.0",
  abobora: "6.0-6.8",
  inhame: "5.5-6.5",
  mandioca: "5.5-7.2",
  milho: "5.8-7.0",
  feijao: "6.0-7.0",
  candja: "5.8-7.0",
  badjiqui: "5.8-7.0",
  "batata-doce": "5.5-6.5",
};

export function MapScreen({
  snapshot,
  route,
  navigate,
  onBack,
  canGoBack,
}: {
  snapshot: PilotSnapshot | null;
  route: AppRoute;
  navigate: Navigate;
  onBack: () => void;
  canGoBack: boolean;
}) {
  const [selectedCommunityId, setSelectedCommunityId] =
    useState("sare-donha-1");
  const selectedCommunity = snapshot?.communities.find(
    (community) => community.id === selectedCommunityId,
  );
  const selectedCrop = useMemo(() => {
    const cropId = route.params?.cropId ?? "mandioca";
    return snapshot?.crops.find((crop) => crop.id === cropId);
  }, [route.params?.cropId, snapshot]);

  if (route.name === "calendar") {
    return (
      <ScrollView contentContainerStyle={commonStyles.content}>
        <ScreenHeader
          onBack={onBack}
          subtitle="Planeamento sazonal para a zona sul, sujeito a validação local."
          title="Calendário"
        />
        <Card>
          <View style={{ gap: spacing.lg }}>
            {["Preparação", "Plantação", "Capinação", "Colheita"].map(
              (step, index) => (
                <View key={step} style={{ gap: spacing.xs }}>
                  <View style={styles.timelineRow}>
                    <Text style={typography.label}>{step}</Text>
                    <Text style={typography.secondary}>
                      {["Set-Out", "Out-Nov", "Dez-Jan", "Mar-Abr"][index]}
                    </Text>
                  </View>
                  <View style={styles.timelineTrack}>
                    <View
                      style={[
                        styles.timelineFill,
                        {
                          backgroundColor:
                            index === 2 ? colors.warning : colors.brandPrimary,
                          width: `${42 + index * 12}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ),
            )}
          </View>
        </Card>
        <Card>
          <Text style={typography.body}>
            Prioridade do MVP: ligar estas épocas às culturas observadas nos
            relatórios do sul e depois receber alertas por comunidade.
          </Text>
        </Card>
      </ScrollView>
    );
  }

  if (route.name === "sample") {
    return (
      <ScrollView contentContainerStyle={commonStyles.content}>
        <ScreenHeader
          onBack={onBack}
          subtitle="Fluxo funcional para registar uma amostra e pedir validação."
          title="Amostra de solo"
        />
        <Card>
          <View style={{ gap: spacing.md }}>
            <ListItem
              icon="numeric-1-circle-outline"
              meta="Comunidade, parcela, cultura e coordenada quando existir GPS."
              title="Levantar dados"
            />
            <ListItem
              icon="numeric-2-circle-outline"
              meta="Recolher amostra composta e guardar fotografia."
              title="Recolher amostra"
            />
            <ListItem
              icon="numeric-3-circle-outline"
              meta="Enviar para laboratório ou técnico responsável."
              title="Validar pH"
            />
            <PrimaryButton
              icon="camera-plus-outline"
              label="Adicionar fotografias"
              onPress={() => undefined}
            />
          </View>
        </Card>
      </ScrollView>
    );
  }

  if (route.name === "crop") {
    return (
      <ScrollView contentContainerStyle={commonStyles.content}>
        <ScreenHeader
          onBack={onBack}
          subtitle="Ficha agrícola com compatibilidade regional e acção segura."
          title={selectedCrop?.label ?? "Cultivo"}
        />
        <Card>
          <View style={{ gap: spacing.md }}>
            <View style={styles.cropHero}>
              <MaterialCommunityIcons
                color="#E84D3D"
                name="fruit-cherries"
                size={64}
              />
              <View style={{ flex: 1 }}>
                <Text style={typography.sectionTitle}>
                  {selectedCrop?.label ?? "Mandioca"}
                </Text>
                <Text style={typography.secondary}>
                  pH de referência{" "}
                  {cropPhRanges[selectedCrop?.id ?? "mandioca"]}
                </Text>
              </View>
            </View>
            {["Bafatá", "Tombali", "Cacheu", "Quinara"].map((region, index) => (
              <View key={region} style={{ gap: spacing.xs }}>
                <View style={styles.timelineRow}>
                  <Text style={typography.label}>{region}</Text>
                  <Text style={typography.secondary}>
                    {[80, 78, 55, 20][index]}%
                  </Text>
                </View>
                <View style={styles.timelineTrack}>
                  <View
                    style={[
                      styles.timelineFill,
                      {
                        backgroundColor:
                          index === 3 ? colors.danger : colors.brandPrimary,
                        width: `${[80, 78, 55, 20][index]}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
            <PrimaryButton
              icon="stethoscope"
              label="Pedir orientação ao Médico Agrícola"
              onPress={() => navigate("root", undefined, "doctor")}
            />
          </View>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        onBack={canGoBack ? onBack : undefined}
        subtitle="Mapa real com coordenadas públicas de Buba e pontos estimados do piloto."
        title="Mapa agrícola"
        action={<Chip label="Satélite" tone="community" />}
      />

      <View style={styles.mapShell}>
        <MapView
          initialCamera={{
            center: bubaCenter,
            heading: 18,
            pitch: 52,
            zoom: 10.4,
          }}
          mapType="satellite"
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
        >
          <Polygon
            coordinates={pilotPolygon}
            fillColor="rgba(31, 107, 53, 0.18)"
            strokeColor={colors.brandPrimary}
            strokeWidth={2}
          />
          <Marker
            coordinate={bubaCenter}
            description="Centro de referência público para Buba"
            title="Buba"
          />
          {communityPoints.map((point) => {
            const community = snapshot?.communities.find(
              (item) => item.id === point.id,
            );

            return (
              <Marker
                coordinate={point}
                key={point.id}
                onPress={() => setSelectedCommunityId(point.id)}
                pinColor={
                  point.id === selectedCommunityId
                    ? colors.warning
                    : colors.brandPrimary
                }
                title={community?.name ?? point.id}
              />
            );
          })}
        </MapView>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <IconMetric
          icon="map-marker-radius"
          label="Buba centro"
          tone="community"
          value="11.5889"
        />
        <IconMetric
          icon="flask-outline"
          label="pH exemplo"
          tone="warning"
          value={snapshot?.phExample.ph.toFixed(1) ?? "-"}
        />
      </View>

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Chip label="Pontos estimados" tone="warning" />
            <Chip label="Mapa interactivo" />
          </View>
          <Text style={typography.sectionTitle}>
            {selectedCommunity?.name ?? "Comunidade"}
          </Text>
          <Text style={typography.body}>
            {selectedCommunity
              ? `${selectedCommunity.areaHectares} ha estimados, parcelas de ${selectedCommunity.parcelSizeHectares} ha, produção orgânica sem uso químico reportado.`
              : "Selecciona uma comunidade no mapa."}
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                icon="calendar-clock"
                label="Calendário"
                onPress={() => navigate("calendar")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                icon="flask-plus-outline"
                label="Amostra"
                onPress={() => navigate("sample")}
              />
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Cultivos observados</Text>
          {(snapshot?.crops.slice(0, 5) ?? []).map((crop) => (
            <ListItem
              icon="sprout-outline"
              key={crop.id}
              meta={`pH de referência ${cropPhRanges[crop.id] ?? "a validar"}`}
              right={
                <MaterialCommunityIcons
                  color={colors.brandPrimary}
                  name="chevron-right"
                  size={24}
                />
              }
              title={crop.label}
              onPress={() => navigate("crop", { cropId: crop.id })}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cropHero: {
    alignItems: "center",
    backgroundColor: "#FFF0EB",
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  mapShell: {
    backgroundColor: colors.sky,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 4,
    height: 342,
    overflow: "hidden",
  },
  timelineFill: {
    borderRadius: 999,
    height: "100%",
  },
  timelineRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timelineTrack: {
    backgroundColor: colors.mutedSurface,
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
  },
});
