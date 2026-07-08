import { describe, expect, it } from "vitest";

import {
  classifyPhValue,
  createSampleRecord,
  shouldEscalateQuestion,
  type ConsultationQuestion,
} from "./index.js";

describe("classifyPhValue", () => {
  it("classifies values below 5.6 as acidic", () => {
    expect(classifyPhValue(5.59)).toBe("acidic");
  });

  it("classifies values from 5.6 to 6.5 as favorable", () => {
    expect(classifyPhValue(5.6)).toBe("favorable");
    expect(classifyPhValue(6.5)).toBe("favorable");
  });

  it("classifies value 7 as neutral", () => {
    expect(classifyPhValue(7)).toBe("neutral");
  });

  it("classifies values above 7 as alkaline", () => {
    expect(classifyPhValue(7.01)).toBe("alkaline");
  });

  it("keeps the gap between favorable and neutral marked as uncertain", () => {
    expect(classifyPhValue(6.7)).toBe("near-neutral");
  });

  it("rejects invalid numeric input", () => {
    expect(() => classifyPhValue(Number.NaN)).toThrow("finite");
  });
});

describe("createSampleRecord", () => {
  it("keeps agronomic validation status explicit and method aware", () => {
    expect(
      createSampleRecord({
        id: "sample-1",
        ph: 6.2,
        status: "field_observed",
        method: "water",
        collectedAt: "2026-07-08",
      }),
    ).toMatchObject({
      id: "sample-1",
      phClass: "favorable",
      status: "field_observed",
      method: "water",
    });
  });
});

describe("shouldEscalateQuestion", () => {
  it("does not escalate when reviewed content answers a low-risk question", () => {
    const input: ConsultationQuestion = {
      text: "Qual o significado de um pH 6.2 no solo?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: false,
      reason: "reviewed_answer_available",
      matchedRiskTerms: [],
    });
  });

  it("escalates questions about chemical dosing", () => {
    const input: ConsultationQuestion = {
      text: "Que dose de ureia devo aplicar por hectare no arroz?",
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["dose", "ureia"],
    });
  });

  it("escalates pesticide and herbicide questions even with reviewed content", () => {
    const input: ConsultationQuestion = {
      text: "Posso usar pesticida e herbicida na mesma semana na mandioca?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["pesticid", "herbicid"],
    });
  });

  it("escalates chemical dosage questions with explicit chemical wording", () => {
    const input: ConsultationQuestion = {
      text: "Qual a dosagem deste químico para o tomate?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["dosagem", "quimic"],
    });
  });

  it("escalates insecticide mixing and spray-burn risk", () => {
    const input: ConsultationQuestion = {
      text: "Misturei insecticida na calda e agora as folhas têm queimaduras. O que faço?",
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["insecticid", "queimad", "misturei", "calda"],
    });
  });

  it("escalates toxicity and poison questions with unknown products", () => {
    const input: ConsultationQuestion = {
      text: "Este produto desconhecido parece veneno tóxico e está sem rótulo. Posso aplicar?",
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: [
        "toxic",
        "veneno",
        "produto desconhecido",
        "sem rotulo",
      ],
    });
  });

  it("escalates serious pest questions", () => {
    const input: ConsultationQuestion = {
      text: "A minha lavoura está a morrer com uma praga grave. O que faço agora?",
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "severe_pest_risk",
      matchedRiskTerms: ["praga grave", "morrer"],
    });
  });

  it("escalates when there is no safe reviewed answer", () => {
    const input: ConsultationQuestion = {
      text: "Qual a melhor forma de guardar sementes para a proxima campanha?",
      hasReviewedAnswer: false,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "no_safe_answer",
      matchedRiskTerms: [],
    });
  });
});
