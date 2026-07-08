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
      matchedRiskTerms: ["aplicar", "dose", "ureia"],
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
      matchedRiskTerms: ["usar", "pesticid", "herbicid"],
    });
  });

  it("escalates chemical dosage questions with explicit chemical wording", () => {
    const input: ConsultationQuestion = {
      text: "Qual a dosagem deste quimico para o tomate?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["dosagem", "quimic"],
    });
  });

  it("escalates unknown product questions even when phrased indirectly", () => {
    const input: ConsultationQuestion = {
      text: "Nao sei que produto e este, posso usar?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["produto", "usar"],
    });
  });

  it("escalates treatment burn reports after application", () => {
    const input: ConsultationQuestion = {
      text: "As folhas ficaram queimadas depois do tratamento. O que faco?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["tratament", "queimad"],
    });
  });

  it("escalates mixing questions even when the products are not named", () => {
    const input: ConsultationQuestion = {
      text: "Posso misturar dois produtos?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["produto", "mistura", "misturar"],
    });
  });

  it("escalates spray dosage questions with operational wording", () => {
    const input: ConsultationQuestion = {
      text: "Qual e a dose para pulverizar?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["pulveriz", "dose"],
    });
  });

  it("escalates exact reapplication timing questions even with reviewed content", () => {
    const input: ConsultationQuestion = {
      text: "Quando volto a aplicar?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["aplicar"],
    });
  });

  it("escalates exact harvest waiting-period questions even with reviewed content", () => {
    const input: ConsultationQuestion = {
      text: "Quanto tempo devo esperar antes da colheita?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: [
        "antes da colheita",
        "esperar antes da colheita",
        "colheita",
      ],
    });
  });

  it("escalates exact parcel re-entry questions even with reviewed content", () => {
    const input: ConsultationQuestion = {
      text: "Posso entrar na parcela amanha?",
      hasReviewedAnswer: true,
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["entrar na parcela", "parcela"],
    });
  });

  it("escalates insecticide mixing and spray-burn risk", () => {
    const input: ConsultationQuestion = {
      text: "Misturei insecticida na calda e agora as folhas tem queimaduras. O que faco?",
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: ["misturei", "insecticid", "queimad", "calda"],
    });
  });

  it("escalates toxicity and poison questions with unknown products", () => {
    const input: ConsultationQuestion = {
      text: "Este produto desconhecido parece veneno toxico e esta sem rotulo. Posso aplicar?",
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: [
        "produto",
        "aplicar",
        "veneno",
        "toxic",
        "produto desconhecido",
        "sem rotulo",
      ],
    });
  });

  it("escalates serious pest questions", () => {
    const input: ConsultationQuestion = {
      text: "A minha lavoura esta a morrer com uma praga grave. O que faco agora?",
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
