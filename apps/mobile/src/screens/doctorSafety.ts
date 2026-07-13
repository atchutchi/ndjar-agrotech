import { shouldEscalateQuestion } from "@ndjar/domain";

interface LocalAnswerTemplate {
  id: string;
  triggerTerms: string[];
  body: string;
}

const LOCAL_SAFE_TEMPLATES: LocalAnswerTemplate[] = [
  {
    id: "soil-ph-basic",
    triggerTerms: ["ph", "solo"],
    body: "Um pH perto de 6 costuma ser favorável para muitas culturas. No piloto N'djar, este dado é apenas um exemplo local e deve ser confirmado por observação ou análise.",
  },
  {
    id: "calendar-basic",
    triggerTerms: ["calendario", "plantar"],
    body: "Para o piloto, consulta o calendário local por mês e confirma a fase da cultura antes de agir. A app não recomenda doses nem produtos.",
  },
  {
    id: "crop-list-basic",
    triggerTerms: ["culturas", "comunidade"],
    body: "A lista piloto mostra as culturas observadas por comunidade e mantém o estado da fonte em cada registo.",
  },
] as const;

interface LocalDoctorQuestionInput {
  cropId?: string;
  question: string;
  regionId?: string;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function findReviewedTemplate(question: string): LocalAnswerTemplate | null {
  const normalizedQuestion = normalizeText(question);

  return (
    LOCAL_SAFE_TEMPLATES.find((template) =>
      template.triggerTerms.every((term) => normalizedQuestion.includes(term)),
    ) ?? null
  );
}

export function evaluateLocalDoctorQuestion(input: LocalDoctorQuestionInput) {
  const template = findReviewedTemplate(input.question);
  const decision = shouldEscalateQuestion({
    cropId: input.cropId,
    language: "pt",
    regionId: input.regionId,
    text: input.question,
  });

  return {
    answer: decision.shouldEscalate ? null : template?.body,
    decision,
    templateId: decision.shouldEscalate ? null : template?.id,
  };
}
