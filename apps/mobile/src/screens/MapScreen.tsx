import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
  {
    id: "sare-donha-1",
    latitude: 11.552,
    longitude: -15.034,
    x: "31%",
    y: "66%",
  },
  {
    id: "sare-donha-2",
    latitude: 11.567,
    longitude: -14.951,
    x: "66%",
    y: "61%",
  },
  { id: "uane", latitude: 11.627, longitude: -15.061, x: "25%", y: "38%" },
  { id: "ugui", latitude: 11.648, longitude: -14.925, x: "73%", y: "30%" },
] as const;

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
  const [samplePhotoCount, setSamplePhotoCount] = useState(0);
  const selectedCommunity = snapshot?.communities.find(
    (community) => community.id === selectedCommunityId,
  );
  const selectedCrop = useMemo(() => {
    const cropId = route.params?.cropId;
    if (!cropId) {
      return undefined;
    }

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
          subtitle="Registo funcional para recolher dados e pedir validação."
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
            {samplePhotoCount > 0 ? (
              <ListItem
                icon="image-check-outline"
                meta={`${samplePhotoCount} fotografia${
                  samplePhotoCount > 1 ? "s" : ""
                } guardada${samplePhotoCount > 1 ? "s" : ""} localmente para teste.`}
                title="Fotografias adicionadas"
              />
            ) : null}
            <PrimaryButton
              icon="camera-plus-outline"
              label="Adicionar fotografias"
              onPress={() => setSamplePhotoCount((count) => count + 1)}
            />
          </View>
        </Card>
      </ScrollView>
    );
  }

  if (route.name === "crop") {
    if (!route.params?.cropId) {
      return (
        <ScrollView contentContainerStyle={commonStyles.content}>
          <ScreenHeader
            onBack={onBack}
            subtitle="Escolhe uma cultura para ver pH de referência, compatibilidade regional e próxima acção."
            title="Informações do cultivo"
          />
          <Card>
            <View style={{ gap: spacing.md }}>
              <Text style={typography.body}>
                Culturas observadas nos dados do piloto sul da Guiné-Bissau. As
                recomendações finais devem ser validadas com pH, solo e técnico
                agrícola.
              </Text>
              {(snapshot?.crops ?? []).map((crop) => (
                <CropRow
                  key={crop.id}
                  meta={`pH de referência ${
                    cropPhRanges[crop.id] ?? "a validar"
                  }`}
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

    const cropId = selectedCrop?.id ?? route.params.cropId;
    const cropImage = cropImages[cropId] ?? mandiocaIcon;

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
              <Image
                resizeMode="cover"
                source={cropImage}
                style={styles.cropImage}
              />
              <View style={{ flex: 1 }}>
                <Text style={typography.sectionTitle}>
                  {selectedCrop?.label ?? "Mandioca"}
                </Text>
                <Text style={typography.secondary}>
                  pH de referência {cropPhRanges[cropId] ?? "a validar"}
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
        action={<Chip label="Satélite" tone="community" />}
        onBack={canGoBack ? onBack : undefined}
        subtitle="Selecciona uma zona para ver solo, aptidão e uso possível."
        title="Mapa agrícola"
      />

      <View style={styles.mapShell}>
        <View style={styles.mapCanvas}>
          <View style={styles.mapSky} />
          <View style={styles.mapGridLineOne} />
          <View style={styles.mapGridLineTwo} />
          <View style={styles.mapLandMass}>
            <Text style={styles.mapLandLabel}>Quinara / Buba</Text>
            <Text style={styles.mapLandMeta}>
              Centro: {bubaCenter.latitude.toFixed(4)},{" "}
              {bubaCenter.longitude.toFixed(4)}
            </Text>
          </View>
          {communityPoints.map((point) => {
            const community = snapshot?.communities.find(
              (item) => item.id === point.id,
            );
            const isSelected = point.id === selectedCommunityId;

            return (
              <Pressable
                accessibilityLabel={community?.name ?? point.id}
                accessibilityRole="button"
                key={point.id}
                onPress={() => setSelectedCommunityId(point.id)}
                style={[
                  styles.mapPoint,
                  { left: point.x, top: point.y },
                  isSelected ? styles.mapPointSelected : null,
                ]}
              >
                <View style={styles.mapPointDot} />
                <Text style={styles.mapPointLabel}>
                  {community?.name ?? point.id}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
          <View style={{ gap: spacing.sm }}>
            <ListItem
              icon="terrain"
              meta="Solo ácido a validar. Confirmar pH, matéria orgânica e drenagem antes de recomendar."
              title="Tipo de solo"
            />
            <ListItem
              icon="grass"
              meta="Possível apenas com validação de água, acesso e pressão animal."
              title="Pastagem animal"
            />
            <ListItem
              icon="leaf-circle-outline"
              meta="Conservação do solo melhora água, fertilidade e actividade biológica."
              title="Manejo recomendado"
            />
          </View>
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
          {(snapshot?.crops.slice(0, 9) ?? []).map((crop) => (
            <CropRow
              key={crop.id}
              meta={`pH de referência ${cropPhRanges[crop.id] ?? "a validar"}`}
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
  mapCanvas: {
    backgroundColor: "#D9EBDD",
    flex: 1,
    overflow: "hidden",
  },
  mapGridLineOne: {
    backgroundColor: "rgba(255,255,255,0.42)",
    height: 3,
    left: -40,
    position: "absolute",
    top: 136,
    transform: [{ rotate: "-17deg" }],
    width: 440,
  },
  mapGridLineTwo: {
    backgroundColor: "rgba(31,107,53,0.18)",
    height: 3,
    left: -30,
    position: "absolute",
    top: 214,
    transform: [{ rotate: "14deg" }],
    width: 430,
  },
  mapLandLabel: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "900",
  },
  mapLandMass: {
    backgroundColor: colors.brandPrimary,
    borderColor: "rgba(255,255,255,0.8)",
    borderRadius: 28,
    borderWidth: 2,
    bottom: 42,
    elevation: 8,
    left: 38,
    padding: spacing.lg,
    position: "absolute",
    right: 34,
    top: 54,
    transform: [{ rotate: "-7deg" }],
  },
  mapLandMeta: {
    color: "#DCEFD8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  mapPoint: {
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 92,
    position: "absolute",
    transform: [{ translateX: -36 }, { translateY: -18 }],
  },
  mapPointDot: {
    backgroundColor: colors.surface,
    borderColor: colors.brandDark,
    borderRadius: 999,
    borderWidth: 3,
    height: 22,
    width: 22,
  },
  mapPointLabel: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textAlign: "center",
  },
  mapPointSelected: {
    transform: [{ translateX: -36 }, { translateY: -18 }, { scale: 1.08 }],
  },
  mapSky: {
    backgroundColor: "#BBDCF7",
    height: 104,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
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
