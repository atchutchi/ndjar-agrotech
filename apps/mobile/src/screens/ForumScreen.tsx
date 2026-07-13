import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import type { AppRoute, Navigate } from "../App";
import {
  Card,
  Chip,
  ListItem,
  PrimaryButton,
  ScreenHeader,
} from "../components/ui";
import { TEMPORARY_DRAFT_NOTICE } from "../demo/demoSafety";
import type { PilotSnapshot } from "../storage/offlineStore";
import { offlineStore } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

const forumTopics = [
  {
    id: "mandioca-quinara",
    title: "Mandioca não cresce em Quinara",
    meta: "12 respostas, pH e solo",
    tone: "primary" as const,
    answer:
      "Começa por confirmar solo, sombra, drenagem e histórico da parcela. Para dose ou calagem, pede amostra validada.",
  },
  {
    id: "arroz-sequeiro",
    title: "Quando plantar arroz de sequeiro?",
    meta: "8 respostas, calendário",
    tone: "warning" as const,
    answer:
      "A janela depende da chuva local. No MVP usamos o calendário do sul como referência e marcamos alerta para validação.",
  },
  {
    id: "lagarta-milho",
    title: "Como combater lagarta no milho?",
    meta: "5 respostas, encaminhar se houver produto",
    tone: "danger" as const,
    answer:
      "Como envolve praga e possível produto, o fluxo deve encaminhar para consultor antes de recomendar tratamento.",
  },
  {
    id: "mercado-bafata",
    title: "Partilha: mercado de Bafata",
    meta: "22 comentários, preços",
    tone: "soil" as const,
    answer:
      "Funcionalidade futura: recolher preço, data, mercado e fonte antes de mostrar tendências.",
  },
];

export function ForumScreen({
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
  const [draft, setDraft] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const topic = forumTopics.find((item) => item.id === route.params?.topicId);

  useEffect(() => {
    offlineStore.getDraft("forum-post").then(setDraft);
  }, []);

  function updateDraft(value: string) {
    setDraft(value);
    setSavedMessage("");
    void offlineStore.saveDraft("forum-post", value);
  }

  if (route.name === "forum-topic" && topic) {
    return (
      <ScrollView contentContainerStyle={commonStyles.content}>
        <ScreenHeader onBack={onBack} title="Discussão" subtitle={topic.meta} />
        <Card>
          <View style={{ gap: spacing.md }}>
            <Chip label="Comunidade" tone={topic.tone} />
            <Text style={typography.sectionTitle}>{topic.title}</Text>
            <Text style={typography.body}>{topic.answer}</Text>
            <ListItem
              icon="account-tie-outline"
              meta="Resposta técnica simulada para MVP. Deve ser revista por agrónomo antes de produção."
              title="Admin N'djar"
            />
            <PrimaryButton
              icon="reply-outline"
              label="Responder"
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
        title="Fórum"
        subtitle="Dúvidas da comunidade com moderação prudente."
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Tópicos activos</Text>
          {forumTopics.map((item) => (
            <ListItem
              icon="forum-outline"
              key={item.id}
              meta={item.meta}
              right={
                <View style={{ flexDirection: "row", gap: spacing.xs }}>
                  <Chip label="Ver" tone={item.tone} />
                  <MaterialCommunityIcons
                    color={colors.brandPrimary}
                    name="chevron-right"
                    size={24}
                  />
                </View>
              }
              title={item.title}
              onPress={() => navigate("forum-topic", { topicId: item.id })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Nova pergunta</Text>
          <Text style={typography.secondary}>
            {snapshot
              ? `Piloto activo: ${snapshot.region.regionName}/${snapshot.region.sectorName}`
              : "Piloto local a carregar."}
          </Text>
          <TextInput
            accessibilityLabel="Rascunho de pergunta para o fórum"
            multiline
            onChangeText={updateDraft}
            placeholder="Ex.: Qual a melhor época para arroz?"
            placeholderTextColor={colors.textSecondary}
            style={[
              commonStyles.input,
              { minHeight: 104, textAlignVertical: "top" },
            ]}
            value={draft}
          />
          <PrimaryButton
            icon="content-save-outline"
            label="Guardar rascunho"
            onPress={() => setSavedMessage(TEMPORARY_DRAFT_NOTICE)}
          />
          {savedMessage ? (
            <Text
              style={[typography.secondary, { color: colors.brandPrimary }]}
            >
              {savedMessage}
            </Text>
          ) : null}
        </View>
      </Card>
    </ScrollView>
  );
}
