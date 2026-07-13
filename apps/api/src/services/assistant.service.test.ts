import { describe, expect, it } from "vitest";

import { AssistantService } from "./assistant.service.js";

describe("AssistantService reviewed templates", () => {
  it("escalates when no formally persisted review is available", () => {
    const result = new AssistantService().answerQuestion({
      channel: "mobile",
      language: "pt",
      question: "O que significa o pH do solo?",
    });

    expect(result).toMatchObject({
      answerType: "pending_review",
      consultationStatus: "pending_review",
      decision: {
        reason: "no_safe_answer",
        shouldEscalate: true,
      },
    });
  });
});
