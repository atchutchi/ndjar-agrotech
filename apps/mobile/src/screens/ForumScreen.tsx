import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import {
  Card,
  Chip,
  ListItem,
  PrimaryButton,
  ScreenHeader,
} from "../components/ui";
import type { PilotSnapshot } from "../storage/offlineStore";
import { offlineStore } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

const forumTopics = [
  {
    id: "mandioca-quinara",
    title: "Mandioca nao cresce em Quinara",
    meta: "12 respostas, pH e solo",
    tone: "primary" as const,
  },
  {
    id: "arroz-sequeiro",
    title: "Quando plantar arroz de sequeiro?",
    meta: "8 respostas, calendario",
    tone: "warning" as const,
  },
  {
    id: "lagarta-milho",
    title: "Como combater lagarta no milho?",
    meta: "5 respostas, encaminhar se houver produto",
    tone: "danger" as const,
  },
  {
    id: "mercado-bafata",
    title: "Partilha: mercado de Bafata",
    meta: "22 comentarios, precos",
    tone: "soil" as const,
  },
];

export function ForumScreen({ snapshot }: { snapshot: PilotSnapshot | null }) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    offlineStore.getDraft("forum-post").then(setDraft);
  }, []);

  function updateDraft(value: string) {
    setDraft(value);
    void offlineStore.saveDraft("forum-post", value);
  }

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        title="Forum"
        subtitle="Duvidas da comunidade com moderacao prudente."
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Topicos</Text>
          {forumTopics.map((topic) => (
            <ListItem
              key={topic.id}
              meta={topic.meta}
              right={<Chip label="Ver" tone={topic.tone} />}
              title={topic.title}
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
            accessibilityLabel="Rascunho de pergunta para o forum"
            multiline
            onChangeText={updateDraft}
            placeholder="Ex.: Qual a melhor epoca para arroz?"
            placeholderTextColor={colors.textSecondary}
            style={[
              commonStyles.input,
              { minHeight: 104, textAlignVertical: "top" },
            ]}
            value={draft}
          />
          <PrimaryButton label="Guardar rascunho" onPress={() => undefined} />
        </View>
      </Card>
    </ScrollView>
  );
}
