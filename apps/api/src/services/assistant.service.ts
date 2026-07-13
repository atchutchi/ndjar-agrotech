import { Injectable } from "@nestjs/common";
import { shouldEscalateQuestion } from "@ndjar/domain";
import { z } from "zod";

import type { EscalationDecision } from "@ndjar/domain";

export const assistantQuestionSchema = z.object({
  question: z.string().trim().min(3),
  cropId: z.string().trim().min(1).optional(),
  regionId: z.string().trim().min(1).optional(),
  language: z.string().trim().min(2).default("pt"),
  channel: z.enum(["mobile", "web", "ussd", "admin"]).default("mobile"),
});

export type AssistantQuestionInput = z.infer<typeof assistantQuestionSchema>;

interface LocalAnswerTemplate {
  id: string;
  triggerTerms: string[];
  body: string;
  reviewedAt: string;
  reviewedByUserId: string;
}

const PILOT_REVIEW = {
  reviewedAt: "2026-07-10T00:00:00.000Z",
  reviewedByUserId: "pilot-agronomic-review-board",
} as const;

const LOCAL_SAFE_TEMPLATES: LocalAnswerTemplate[] = [
  {
    id: "soil-ph-basic",
    triggerTerms: ["ph", "solo"],
    body: "O pH descreve a acidez ou alcalinidade da amostra. Nao determina, por si so, a adequacao de uma cultura. Confirma o metodo, a profundidade e a analise local antes de recomendar uma accao.",
    ...PILOT_REVIEW,
  },
  {
    id: "calendar-basic",
    triggerTerms: ["calendario", "plantar"],
    body: "Para o piloto, consulta o calendario local por mes e confirma a fase da cultura antes de agir. A API nao recomenda doses nem produtos.",
    ...PILOT_REVIEW,
  },
  {
    id: "crop-list-basic",
    triggerTerms: ["culturas", "comunidade"],
    body: "A lista piloto mostra as culturas observadas por comunidade e mantem o estado da fonte em cada registo.",
    ...PILOT_REVIEW,
  },
] as const;

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

function dueIn24Hours(now: Date): string {
  return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

@Injectable()
export class AssistantService {
  answerQuestion(input: AssistantQuestionInput, now = new Date()) {
    const template = findReviewedTemplate(input.question);
    const decision = shouldEscalateQuestion({
      text: input.question,
      cropId: input.cropId,
      regionId: input.regionId,
      language: input.language,
      reviewedAnswer: template
        ? {
            reviewedAt: template.reviewedAt,
            reviewedByUserId: template.reviewedByUserId,
            templateId: template.id,
          }
        : undefined,
    });

    if (decision.shouldEscalate) {
      return this.buildEscalation(input, decision, now);
    }

    return {
      answerType: "deterministic_template",
      status: "answered_by_template",
      consultationStatus: "answered_by_template",
      source: "local_reviewed_template",
      templateId: template?.id,
      review: template
        ? {
            reviewedAt: template.reviewedAt,
            reviewedByUserId: template.reviewedByUserId,
            templateId: template.id,
          }
        : undefined,
      decision,
      response: {
        body: template?.body,
        safetyNote:
          "Resposta deterministica do MVP. Perguntas sobre doses, produtos, pragas severas, colheita ou operacoes inseguras sao escaladas.",
      },
    };
  }

  private buildEscalation(
    input: AssistantQuestionInput,
    decision: EscalationDecision,
    now: Date,
  ) {
    return {
      answerType: "pending_review",
      status: "escalated",
      consultationStatus: "pending_review",
      source: "domain_escalation_rule",
      decision,
      response: null,
      escalation: {
        assigneeRole: "Medico Agricola",
        reason: decision.reason,
        matchedRiskTerms: decision.matchedRiskTerms,
        dueInHours: 24,
        dueAt: dueIn24Hours(now),
        note: `Pergunta recebida por ${input.channel}. A resposta livre por IA esta desactivada nesta fase.`,
      },
    };
  }
}
