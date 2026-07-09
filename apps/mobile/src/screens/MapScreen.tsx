import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import aboboraIcon from "../../assets/crops/abobora.png";
import arrozIcon from "../../assets/crops/arroz.png";
import badjiquiIcon from "../../assets/crops/badjiqui.png";
import batataDoceIcon from "../../assets/crops/batata-doce.png";
import candjaIcon from "../../assets/crops/candja.png";
import feijaoIcon from "../../assets/crops/feijao.png";
import inhameIcon from "../../assets/crops/inhame.png";
import mandiocaIcon from "../../assets/crops/mandioca.png";
import milhoIcon from "../../assets/crops/milho.png";
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
import { AgriculturalCalendarScreen } from "./AgriculturalCalendarScreen";
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
  abobora: "6.0-6.8",
  arroz: "5.5-7.0",
  badjiqui: "5.8-7.0",
  "batata-doce": "5.5-6.5",
  candja: "5.8-7.0",
  feijao: "6.0-7.0",
  inhame: "5.5-6.5",
  mandioca: "5.5-7.2",
  milho: "5.8-7.0",
};

const cropImages: Record<string, number> = {
  abobora: aboboraIcon,
  arroz: arrozIcon,
  badjiqui: badjiquiIcon,
  "batata-doce": batataDoceIcon,
  candja: candjaIcon,
  feijao: feijaoIcon,
  inhame: inhameIcon,
  mandioca: mandiocaIcon,
  milho: milhoIcon,
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
    return <AgriculturalCalendarScreen onBack={onBack} />;
  }

  if (route.name === "sample") {
    return (
      <ScrollView contentContainerStyle={commonStyles.content}>
        <ScreenHeader
          onBack={onBack}
          subtitle="Registo funcional para recolher dados e pedir validaÃ§Ã£o."
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
              meta="Enviar para laboratÃ³rio ou tÃ©cnico responsÃ¡vel."
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
    const cropId = selectedCrop?.id ?? "mandioca";

    return (
      <ScrollView contentContainerStyle={commonStyles.content}>
        <ScreenHeader
          onBack={onBack}
          subtitle="Ficha agrÃ­cola com compatibilidade regional e acÃ§Ã£o segura."
          title={selectedCrop?.label ?? "Cultivo"}
        />
        <Card>
          <View style={{ gap: spacing.md }}>
            <View style={styles.cropHero}>
              <Image
                resizeMode="cover"
                source={cropImages[cropId]}
                style={styles.cropImage}
              />
              <View style={{ flex: 1 }}>
                <Text style={typography.sectionTitle}>
                  {selectedCrop?.label ?? "Mandioca"}
                </Text>
                <Text style={typography.secondary}>
                  pH de referÃªncia {cropPhRanges[cropId] ?? "a validar"}
                </Text>
              </View>
            </View>
            {["BafatÃ¡", "Tombali", "Cacheu", "Quinara"].map(
              (region, index) => (
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
              ),
            )}
            <PrimaryButton
              icon="stethoscope"
              label="Pedir orientaÃ§Ã£o ao MÃ©dico AgrÃ­cola"
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
        action={<Chip label="SatÃ©lite" tone="community" />}
        onBack={canGoBack ? onBack : undefined}
        subtitle="Selecciona uma zona para ver solo, aptidÃ£o e uso possÃ­vel."
        title="Mapa agrÃ­cola"
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
            description="Centro de referÃªncia pÃºblico para Buba"
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
              ? `${selectedCommunity.areaHectares} ha estimados, parcelas de ${selectedCommunity.parcelSizeHectares} ha, produÃ§Ã£o orgÃ¢nica sem uso quÃ­mico reportado.`
              : "Selecciona uma comunidade no mapa."}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <ListItem
              icon="terrain"
              meta="Solo Ã¡cido a validar. Confirmar pH, matÃ©ria orgÃ¢nica e drenagem antes de recomendar."
              title="Tipo de solo"
            />
            <ListItem
              icon="grass"
              meta="PossÃ­vel apenas com validaÃ§Ã£o de Ã¡gua, acesso e pressÃ£o animal."
              title="Pastagem animal"
            />
            <ListItem
              icon="leaf-circle-outline"
              meta="ConservaÃ§Ã£o do solo melhora Ã¡gua, fertilidade e actividade biolÃ³gica."
              title="Manejo recomendado"
            />
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                icon="calendar-clock"
                label="CalendÃ¡rio"
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
          {(snapshot?.crops.slice(0, 9) ?? []).map((crop) => (
            <CropRow
              key={crop.id}
              meta={`pH de referÃªncia ${cropPhRanges[crop.id] ?? "a validar"}`}
              source={cropImages[crop.id] ?? mandiocaIcon}
              title={crop.label}
              onPress={() => navigate("crop", { cropId: crop.id })}
            />
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function CropRow({
  title,
  meta,
  source,
  onPress,
}: {
  title: string;
  meta: string;
  source: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.cropRow,
        pressed ? { opacity: 0.74 } : null,
      ]}
    >
      <Image resizeMode="cover" source={source} style={styles.cropThumb} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={typography.label}>{title}</Text>
        <Text style={typography.secondary}>{meta}</Text>
      </View>
      <MaterialCommunityIcons
        color={colors.brandPrimary}
        name="chevron-right"
        size={24}
      />
    </Pressable>
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
  cropImage: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    height: 96,
    width: 96,
  },
  cropRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 78,
    padding: spacing.md,
  },
  cropThumb: {
    borderRadius: 8,
    height: 54,
    width: 54,
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
