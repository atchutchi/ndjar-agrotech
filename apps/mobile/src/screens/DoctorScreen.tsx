import { shouldEscalateQuestion } from "@ndjar/domain";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Card, Chip, PrimaryButton, ScreenHeader } from "../components/ui";
import type { PilotSnapshot } from "../storage/offlineStore";
import { offlineStore } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";

const SAFE_REVIEWED_TERMS = [
  "ph",
  "solo",
  "amostra",
  "mandioca",
  "arroz",
  "milho",
  "feijao",
  "calendario",
  "plantar",
] as const;

function hasLocalReviewedAnswer(question: string): boolean {
  const normalized = question
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  return SAFE_REVIEWED_TERMS.some((term) => normalized.includes(term));
}

function buildSafeAnswer(question: string): string {
  const normalized = question
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  if (normalized.includes("ph") || normalized.includes("solo")) {
    return "Regista a amostra, confirma comunidade e metodo, e espera validacao antes de decidir calagem ou produto.";
  }

  if (normalized.includes("calendario") || normalized.includes("plantar")) {
    return "Usa o calendario local como guia de epoca e confirma no campo se as chuvas ja estao regulares.";
  }

  return "Regista cultura, comunidade e sintomas. A resposta local segura e observar a parcela, juntar fotos e evitar dosagens sem consultor.";
}

export function DoctorScreen({ snapshot }: { snapshot: PilotSnapshot | null }) {
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

  function submitQuestion() {
    const trimmedQuestion = question.trim();

    if (trimmedQuestion.length < 8) {
      setResult(
        "Escreve a pergunta com cultura, comunidade e sinal observado.",
      );
      return;
    }

    const decision = shouldEscalateQuestion({
      cropId: exampleCrop?.id,
      hasReviewedAnswer: hasLocalReviewedAnswer(trimmedQuestion),
      language: "pt",
      regionId: snapshot?.region.id,
      text: trimmedQuestion,
    });

    if (decision.shouldEscalate) {
      setResult(
        "Escalar para consultor em 24h. Nao dar dose, mistura, produto ou prazo de colheita sem revisao.",
      );
      return;
    }

    setResult(buildSafeAnswer(trimmedQuestion));
  }

  return (
    <ScrollView contentContainerStyle={commonStyles.content}>
      <ScreenHeader
        title="Medico Agricola"
        subtitle="Perguntas locais com triagem prudente."
      />

      <Card>
        <View style={{ gap: spacing.md }}>
          <Chip label="Triagem local" />
          <Text style={typography.body}>
            Perguntas inseguras seguem para consultor. A app so responde quando
            a regra local permite uma resposta deterministica.
          </Text>
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.md }}>
          <Text style={typography.sectionTitle}>Nova pergunta</Text>
          <Text style={typography.label}>Descreve o problema</Text>
          <TextInput
            accessibilityLabel="Pergunta para o Medico Agricola"
            multiline
            onChangeText={updateQuestion}
            placeholder="Ex.: A mandioca nao cresce em Sare Donha 1"
            placeholderTextColor={colors.textSecondary}
            style={[
              commonStyles.input,
              { minHeight: 116, textAlignVertical: "top" },
            ]}
            value={question}
          />
          <PrimaryButton label="Verificar pergunta" onPress={submitQuestion} />
        </View>
      </Card>

      {result ? (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text style={typography.sectionTitle}>Resultado</Text>
            <Text style={typography.body}>{result}</Text>
          </View>
        </Card>
      ) : null}
    </ScrollView>
  );
}
