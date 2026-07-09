import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Card, Chip, PrimaryButton, ScreenHeader } from "../components/ui";
import type { PilotSnapshot } from "../storage/offlineStore";
import { offlineStore } from "../storage/offlineStore";
import { colors, commonStyles, spacing, typography } from "../theme";
import { evaluateLocalDoctorQuestion } from "./doctorSafety";

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

    const result = evaluateLocalDoctorQuestion({
      cropId: exampleCrop?.id,
      question: trimmedQuestion,
      regionId: snapshot?.region.id,
    });

    if (result.decision.shouldEscalate) {
      setResult(
        "Escalar para consultor em 24h. Nao dar dose, mistura, produto ou prazo de colheita sem revisao.",
      );
      return;
    }

    setResult(result.answer ?? "Escalar para consultor em 24h.");
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
