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

function dueIn24Hours(now: Date): string {
  return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

@Injectable()
export class AssistantService {
  answerQuestion(input: AssistantQuestionInput, now = new Date()) {
    const decision = shouldEscalateQuestion({
      text: input.question,
      cropId: input.cropId,
      regionId: input.regionId,
      language: input.language,
    });

    return this.buildEscalation(input, decision, now);
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
