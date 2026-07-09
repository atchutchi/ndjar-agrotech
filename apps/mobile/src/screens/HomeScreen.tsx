import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import agriHero from "../../assets/ndjar-agri-realistic.png";
import ndjarIcon from "../../assets/brand/ndjar-icon.png";
import ods1 from "../../assets/ods/ods-1.png";
import ods2 from "../../assets/ods/ods-2.png";
import ods3 from "../../assets/ods/ods-3.png";
import ods5 from "../../assets/ods/ods-5.webp";
import ods8 from "../../assets/ods/ods-8.png";
import ods9 from "../../assets/ods/ods-9.png";
import ods10 from "../../assets/ods/ods-10.jpg";
import ods13 from "../../assets/ods/ods-13.webp";
import ods15 from "../../assets/ods/ods-15.png";
import type { AppRoute, Navigate } from "../App";
import {
  Card,
  Chip,
  ListItem,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
} from "../components/ui";
import type { TabId } from "../navigation/tabs";
import type { PilotSnapshot } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

const odsImages = [ods1, ods2, ods3, ods5, ods8, ods9, ods10, ods13, ods15];

export function HomeScreen({
  snapshot,
  onOpenTab,
  navigate,
  route,
  hasSubscription,
  activateSubscription,
  onBack,
}: {
  snapshot: PilotSnapshot | null;
  onOpenTab: (tabId: TabId) => void;
  navigate: Navigate;
  route: AppRoute;
  hasSubscription: boolean;
  activateSubscription: () => void;
  onBack: () => void;
}) {
  if (route.name === "subscription") {
    return (
      <SubscriptionScreen
        activateSubscription={activateSubscription}
        hasSubscription={hasSubscription}
        onBack={onBack}
      />
    );
  }

  if (route.name === "about") {
    return <AboutScreen onBack={onBack} />;
  }

  if (route.name === "contact") {
    return <ContactScreen onBack={onBack} />;
  }

  const regionLabel = snapshot
    ? `${snapshot.region.regionName} / ${snapshot.region.sectorName}`
    : "Piloto sul";

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <View style={styles.brandBar}>
        <Image resizeMode="contain" source={ndjarIcon} style={styles.logo} />
        <View style={{ flex: 1 }}>
          <Text style={styles.brandName}>N'djar</Text>
          <Text style={typography.secondary}>Nha Labur, Nha Sustento</Text>
        </View>
        <View style={styles.notificationButton}>
          <MaterialCommunityIcons
            color={colors.soil}
            name="bell-outline"
            size={24}
          />
        </View>
      </View>

      <ImageBackground
        imageStyle={styles.heroImage}
        resizeMode="cover"
        source={agriHero}
        style={styles.hero}
      >
        <View style={styles.heroScrim}>
          <Chip
            label={hasSubscription ? "Plano activo" : "Calendário grátis"}
          />
          <Text style={styles.heroTitle}>Aptidão agrícola das terras</Text>
          <Text style={styles.heroSubtitle}>
            {regionLabel}. Informação agrícola, solo, cultivo e consulta técnica
            com acesso por subscrição.
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.subscriptionStrip}>
        <View style={{ flex: 1 }}>
          <Text style={typography.label}>
            {hasSubscription ? "Acesso desbloqueado" : "Plano Agricultor"}
          </Text>
          <Text style={typography.secondary}>
            {hasSubscription
              ? "Mapa, cultivos, fórum e Médico Agrícola activos."
              : "15.000 XOF para aceder aos módulos técnicos."}
          </Text>
        </View>
        <SecondaryButton
          icon={hasSubscription ? "check-circle-outline" : "lock-open-outline"}
          label={hasSubscription ? "Activo" : "Subscrever"}
          onPress={() => navigate("subscription")}
        />
      </View>

      <View style={styles.moduleGrid}>
        <ModuleTile
          color={colors.action}
          icon="calendar-month-outline"
          label="Calendário"
          meta="Livre"
          onPress={() => navigate("calendar")}
        />
        <ModuleTile
          color={colors.soil}
          icon="map-marker-radius-outline"
          label="Mapa"
          locked={!hasSubscription}
          meta="Solo e aptidão"
          onPress={() => onOpenTab("map")}
        />
        <ModuleTile
          color={colors.warning}
          icon="link-variant"
          label="Subscrição"
          meta="15.000 XOF"
          onPress={() => navigate("subscription")}
        />
        <ModuleTile
          color="#F26B38"
          icon="sprout-outline"
          label="Informações do Cultivo"
          locked={!hasSubscription}
          meta="Fichas agrícolas"
          onPress={() => navigate("crop", { cropId: "arroz" }, "map")}
        />
        <ModuleTile
          color={colors.action}
          icon="forum-outline"
          label="Fórum"
          locked={!hasSubscription}
          meta="Perguntas"
          onPress={() => onOpenTab("forum")}
        />
        <ModuleTile
          color={colors.soil}
          icon="medical-bag"
          label="Médico Agrícola"
          locked={!hasSubscription}
          meta="Consultoria"
          onPress={() => onOpenTab("doctor")}
        />
        <ModuleTile
          color={colors.warning}
          icon="newspaper-variant-outline"
          label="Sobre nós"
          meta="ODS e missão"
          onPress={() => navigate("about")}
        />
        <ModuleTile
          color="#F26B38"
          icon="phone-outline"
          label="Contacto"
          meta="Apoio"
          onPress={() => navigate("contact")}
        />
      </View>
    </ScrollView>
  );
}

function SubscriptionScreen({
  hasSubscription,
  activateSubscription,
  onBack,
}: {
  hasSubscription: boolean;
  activateSubscription: () => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        onBack={onBack}
        title="Subscrição"
        subtitle="O acesso pago financia estudos no terreno, consultores e actualização da base agrícola."
      />
      <Card>
        <View style={{ gap: spacing.lg }}>
          <View style={styles.priceHeader}>
            <Image
              resizeMode="contain"
              source={ndjarIcon}
              style={styles.planLogo}
            />
            <View style={{ flex: 1 }}>
              <Text style={typography.sectionTitle}>Plano Agricultor</Text>
              <Text style={styles.price}>15.000 XOF</Text>
              <Text style={typography.secondary}>
                Acesso aos módulos técnicos
              </Text>
            </View>
          </View>
          <ListItem
            icon="map-search-outline"
            meta="Mapa interactivo, solo, aptidão agrícola e pastagem por zona."
            title="Mapa e solo"
          />
          <ListItem
            icon="sprout-outline"
            meta="Fichas de cultivo, pH de referência e recomendações prudentes."
            title="Informações do cultivo"
          />
          <ListItem
            icon="medical-bag"
            meta="Triagem automática e encaminhamento para consultor agrícola."
            title="Médico Agrícola"
          />
          <PrimaryButton
            icon="cellphone-check"
            label={
              hasSubscription ? "Plano já activo" : "Pagar com Orange Money"
            }
            onPress={activateSubscription}
          />
          <SecondaryButton
            icon="cellphone"
            label="Pagar com TeleTaku"
            onPress={activateSubscription}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        onBack={onBack}
        title="Sobre nós"
        subtitle="N'djar é aptidão agrícola das terras para uso eficiente do solo na Guiné-Bissau."
      />
      <Card>
        <View style={{ gap: spacing.md }}>
          <Image
            resizeMode="contain"
            source={ndjarIcon}
            style={styles.aboutLogo}
          />
          <Text style={typography.body}>
            Somos uma startup tecnológica que cria soluções simples e funcionais
            para agricultura, dados, solo e assistência técnica.
          </Text>
          <Text style={typography.body}>
            N'djar interpreta informação do solo, limitações da terra e
            possibilidades de uso adequado para ajudar agricultores a decidir o
            que, como e onde produzir.
          </Text>
          <ListItem
            icon="target"
            meta="Segurança, eficiência, qualidade e economia para o mercado guineense."
            title="Missão"
          />
          <ListItem
            icon="handshake-outline"
            meta="Satisfação do cliente, respeito, segurança, inovação, lucro responsável e honestidade."
            title="Valores"
          />
        </View>
      </Card>
      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>ODS ligados ao N'djar</Text>
          <View style={styles.odsGrid}>
            {odsImages.map((image, index) => (
              <Image
                key={index}
                resizeMode="contain"
                source={image}
                style={styles.odsImage}
              />
            ))}
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

function ContactScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        onBack={onBack}
        title="Contacto"
        subtitle="Canal directo para agricultores, cooperativas, ONGs e parceiros."
      />
      <Card>
        <View style={{ gap: spacing.md }}>
          <ListItem
            icon="map-marker-outline"
            meta="Bairro de Ajuda 1ª Fase, Bissau"
            title="Endereço"
          />
          <ListItem
            icon="phone-outline"
            meta="+245 956 086 144"
            title="Telefone"
          />
          <ListItem
            icon="email-outline"
            meta="info@abiptom.com"
            title="Email"
          />
          <ListItem
            icon="account-group-outline"
            meta="Cooperativas, ONGs, Governo, sector privado e investidores."
            title="Parceiros"
          />
          <PrimaryButton
            icon="message-outline"
            label="Enviar pedido de apoio"
            onPress={() => undefined}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

function ModuleTile({
  icon,
  label,
  meta,
  color,
  locked,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  meta: string;
  color: string;
  locked?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleTile,
        pressed ? { opacity: 0.76 } : null,
      ]}
    >
      <View style={[styles.moduleIcon, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons
          color={color}
          name={locked ? "lock-outline" : icon}
          size={42}
        />
      </View>
      <Text style={styles.moduleLabel}>{label}</Text>
      <Text style={styles.moduleMeta}>{locked ? "Pago" : meta}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  aboutLogo: {
    alignSelf: "center",
    height: 94,
    width: 94,
  },
  brandBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    elevation: 3,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
  brandName: {
    color: colors.soil,
    fontSize: 25,
    fontWeight: "900",
  },
  hero: {
    borderRadius: 8,
    minHeight: 188,
    overflow: "hidden",
  },
  heroImage: {
    borderRadius: 8,
  },
  heroScrim: {
    backgroundColor: "rgba(8, 34, 18, 0.46)",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  heroSubtitle: {
    color: "#EDF7EC",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31,
  },
  logo: {
    height: 54,
    width: 54,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  moduleIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 82,
    justifyContent: "center",
    width: 82,
  },
  moduleLabel: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
    textAlign: "center",
  },
  moduleMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  moduleTile: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 2,
    gap: spacing.md,
    justifyContent: "center",
    minHeight: 190,
    padding: spacing.lg,
    width: "48%",
  },
  notificationButton: {
    alignItems: "center",
    backgroundColor: "#F5F3F1",
    borderRadius: 8,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  odsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  odsImage: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    height: 70,
    width: 70,
  },
  planLogo: {
    height: 74,
    width: 74,
  },
  price: {
    color: colors.brandPrimary,
    fontSize: 32,
    fontWeight: "900",
  },
  priceHeader: {
    alignItems: "center",
    backgroundColor: colors.mutedSurface,
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
  },
  subscriptionStrip: {
    alignItems: "center",
    backgroundColor: colors.surfaceWarm,
    borderColor: "#F4D99A",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md,
  },
});
