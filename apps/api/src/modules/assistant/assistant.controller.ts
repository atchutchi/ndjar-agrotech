import { Body, Controller, Inject, Post } from "@nestjs/common";

import {
  AssistantService,
  assistantQuestionSchema,
} from "../../services/assistant.service.js";
import { parseRequestBody } from "../../services/request-validation.js";

@Controller("assistant")
export class AssistantController {
  constructor(
    @Inject(AssistantService) private readonly assistant: AssistantService,
  ) {}

  @Post("ask")
  askQuestion(@Body() body: unknown) {
    const input = parseRequestBody(assistantQuestionSchema, body);

    return this.assistant.answerQuestion(input);
  }
}
