import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import agriHero from "../../assets/ndjar-agri-realistic.png";
import type { Navigate } from "../App";
import {
  Card,
  Chip,
  ListItem,
  PhotoCard,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
} from "../components/ui";
import {
  createDoctorDraftResult,
  TEMPORARY_DRAFT_NOTICE,
} from "../demo/demoSafety";
import type { PilotSnapshot } from "../storage/offlineStore";
import { offlineStore } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";
import { evaluateLocalDoctorQuestion } from "./doctorSafety";

const quickQuestions = [
  "A mandioca não cresce em Sare Donha 1",
  "Quando plantar arroz de sequeiro em Buba?",
  "Posso misturar produto para combater lagarta no milho?",
];

export function DoctorScreen({
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
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    offlineStore.getDraft("doctor-question").then(setQuestion);
  }, []);

  const exampleCrop = useMemo(() => {
    return snapshot?.crops.find((crop) => crop.id === "mandioca");
  }, [snapshot]);

  function updateQuestion(value: string) {
    setQuestion(value);
    void offlineStore.saveDraft("doctor-question", value);
  }

  function submitQuestion(questionOverride?: string) {
    const sourceQuestion =
      typeof questionOverride === "string" ? questionOverride : question;
    const trimmedQuestion = sourceQuestion.trim();

    if (trimmedQuestion.length < 8) {
      setResult(
        "Escreve a pergunta com cultura, comunidade e sinal observado.",
      );
      return;
    }

    const localResult = evaluateLocalDoctorQuestion({
      cropId: exampleCrop?.id,
      question: trimmedQuestion,
      regionId: snapshot?.region.id,
    });

    if (localResult.decision.shouldEscalate) {
      setResult(createDoctorDraftResult().message);
      return;
    }

    setResult(localResult.answer ?? createDoctorDraftResult().message);
  }

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        onBack={canGoBack ? onBack : undefined}
        title="Médico Agrícola"
        subtitle="Triagem educativa local. Esta demonstração não envia pedidos a consultores."
      />

      <PhotoCard
        image={agriHero}
        subtitle="A análise usa apenas textos locais de demonstração. Casos de risco ficam como rascunho temporário."
        title="Consulta no campo"
      >
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              icon="message-processing-outline"
              label="Analisar localmente"
              onPress={() => submitQuestion()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              icon="map-marker-radius-outline"
              label="Mapa"
              onPress={() => navigate("root", undefined, "map")}
            />
          </View>
        </View>
      </PhotoCard>

      {result ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            <Text style={typography.sectionTitle}>Resultado</Text>
            <Text style={typography.body}>{result}</Text>
            <ListItem
              icon="content-save-alert-outline"
              meta={TEMPORARY_DRAFT_NOTICE}
              title="Não enviado"
            />
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Chip label="Resposta local" />
            <Chip label="Sem envio" tone="warning" />
          </View>
          <Text style={typography.sectionTitle}>Perguntas rápidas</Text>
          {quickQuestions.map((item) => (
            <ListItem
              icon="comment-question-outline"
              key={item}
              meta="Tocar para preencher a pergunta"
              title={item}
              onPress={() => {
                updateQuestion(item);
                submitQuestion(item);
              }}
            />
          ))}
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Nova pergunta</Text>
          <Text style={typography.label}>Descreve o problema</Text>
          <TextInput
            accessibilityLabel="Pergunta para o Médico Agrícola"
            multiline
            onChangeText={updateQuestion}
            placeholder="Ex.: A mandioca não cresce em Sare Donha 1"
            placeholderTextColor={colors.textSecondary}
            style={[
              commonStyles.input,
              { minHeight: 124, textAlignVertical: "top" },
            ]}
            value={question}
          />
          <PrimaryButton
            icon="shield-check-outline"
            label="Analisar pergunta localmente"
            onPress={() => submitQuestion()}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
