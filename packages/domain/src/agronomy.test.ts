import { describe, expect, it } from "vitest";

import {
  classifyPhValue,
  createSampleRecord,
  shouldEscalateQuestion,
  type ConsultationQuestion,
} from "./index.js";

const reviewedAnswer = {
  reviewedAt: "2026-07-13T10:00:00.000Z",
  reviewedByUserId: "doctor-1",
  templateId: "soil-ph-explanation-v1",
};

describe("classifyPhValue", () => {
  it("classifies pH using chemical bands without implying crop suitability", () => {
    expect(classifyPhValue(4.49)).toBe("strongly-acidic");
    expect(classifyPhValue(4.5)).toBe("acidic");
    expect(classifyPhValue(5.5)).toBe("slightly-acidic");
    expect(classifyPhValue(6.5)).toBe("neutral");
    expect(classifyPhValue(7.5)).toBe("neutral");
    expect(classifyPhValue(7.51)).toBe("alkaline");
  });

  it("rejects non-finite and out-of-scale pH values", () => {
    expect(() => classifyPhValue(Number.NaN)).toThrow("finite");
    expect(() => classifyPhValue(-0.01)).toThrow("between 0 and 14");
    expect(() => classifyPhValue(14.01)).toThrow("between 0 and 14");
    expect(classifyPhValue(0)).toBe("strongly-acidic");
    expect(classifyPhValue(14)).toBe("alkaline");
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
      phClass: "slightly-acidic",
      status: "field_observed",
      method: "water",
    });
  });
});

describe("shouldEscalateQuestion", () => {
  it("does not escalate when reviewed content answers a low-risk question", () => {
    const input: ConsultationQuestion = {
      text: "Qual o significado de um pH 6.2 no solo?",
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
      reviewedAnswer,
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
    };

    expect(shouldEscalateQuestion(input)).toEqual({
      shouldEscalate: true,
      reason: "no_safe_answer",
      matchedRiskTerms: [],
    });
  });
});
