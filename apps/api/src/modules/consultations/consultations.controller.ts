import { Body, Controller, Inject, Post } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { AssistantService } from "../../services/assistant.service.js";
import { parseRequestBody } from "../../services/request-validation.js";

const consultationCreateSchema = z.object({
  question: z.string().trim().min(3),
  cropId: z.string().trim().min(1).optional(),
  regionId: z.string().trim().min(1).optional(),
  communityId: z.string().trim().min(1).optional(),
  language: z.string().trim().min(2).default("pt"),
  channel: z.enum(["mobile", "web", "ussd", "admin"]).default("mobile"),
  offlineClientId: z.string().trim().min(1).optional(),
});

@Controller("consultations")
export class ConsultationsController {
  constructor(
    @Inject(AssistantService) private readonly assistant: AssistantService,
  ) {}

  @Post()
  createConsultation(@Body() body: unknown) {
    const input = parseRequestBody(consultationCreateSchema, body);
    const assistantResult = this.assistant.answerQuestion(input);

    return {
      consultation: {
        id: randomUUID(),
        question: input.question,
        cropId: input.cropId ?? null,
        regionId: input.regionId ?? null,
        communityId: input.communityId ?? null,
        channel: input.channel,
        language: input.language,
        offlineClientId: input.offlineClientId ?? null,
        status: assistantResult.consultationStatus,
        createdAt: new Date().toISOString(),
      },
      assistant: assistantResult,
      mobile: {
        showImmediateAnswer:
          assistantResult.answerType === "deterministic_template",
        showPendingReview:
          assistantResult.consultationStatus === "pending_review",
      },
    };
  }
}
