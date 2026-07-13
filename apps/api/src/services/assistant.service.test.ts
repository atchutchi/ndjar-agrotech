import { describe, expect, it } from "vitest";

import { AssistantService } from "./assistant.service.js";

describe("AssistantService reviewed templates", () => {
  it("returns traceable review metadata with a deterministic answer", () => {
    const result = new AssistantService().answerQuestion({
      channel: "mobile",
      language: "pt",
      question: "O que significa o pH do solo?",
    });

    expect(result).toMatchObject({
      answerType: "deterministic_template",
      review: {
        reviewedAt: expect.any(String),
        reviewedByUserId: expect.any(String),
        templateId: "soil-ph-basic",
      },
    });
  });
});
