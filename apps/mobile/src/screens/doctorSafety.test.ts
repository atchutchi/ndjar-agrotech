import { describe, expect, it } from "vitest";

import { evaluateLocalDoctorQuestion } from "./doctorSafety";

describe("evaluateLocalDoctorQuestion", () => {
  it("escalates a generic crop question without an explicit reviewed template", () => {
    expect(
      evaluateLocalDoctorQuestion({
        cropId: "mandioca",
        question: "A mandioca nao cresce em Sare Donha 1",
        regionId: "quinara-buba",
      }),
    ).toMatchObject({
      answer: null,
      decision: {
        reason: "no_safe_answer",
        shouldEscalate: true,
      },
    });
  });

  it("does not answer a pH question without traceable medical review", () => {
    expect(
      evaluateLocalDoctorQuestion({
        cropId: "mandioca",
        question: "Qual o significado de um pH 6.2 no solo?",
        regionId: "quinara-buba",
      }),
    ).toMatchObject({
      answer: null,
      decision: {
        reason: "no_safe_answer",
        shouldEscalate: true,
      },
      templateId: null,
    });
  });
});
