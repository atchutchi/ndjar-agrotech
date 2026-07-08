const OPERATIONAL_RISK_TERMS = [
  "produto",
  "tratament",
  "remedio",
  "remedi",
  "aplicar",
  "apliquei",
  "usar",
  "uso",
  "pulveriz",
  "comprar",
  "mistura",
  "misturar",
  "misturei",
  "folhas queimad",
  "intoxic",
  "veneno",
  "dose",
  "dosagem",
  "dosar",
  "quantidade",
  "adubo",
  "calagem",
  "pesticid",
  "herbicid",
  "insecticid",
  "inseticid",
  "fungicid",
  "quimic",
  "toxic",
  "queimad",
  "calda",
  "combinar",
  "produto desconhecido",
  "sem rotulo",
  "ureia",
  "fertiliz",
] as const;
const SEVERE_PEST_TERMS = [
  "praga grave",
  "infest",
  "morrer",
  "doenca grave",
  "doença grave",
] as const;

export interface ConsultationQuestion {
  text: string;
  cropId?: string;
  regionId?: string;
  language?: string;
  hasReviewedAnswer?: boolean;
}

export type EscalationReason =
  | "reviewed_answer_available"
  | "chemical_or_dosage_risk"
  | "severe_pest_risk"
  | "no_safe_answer";

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason: EscalationReason;
  matchedRiskTerms: string[];
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchTerms(text: string, terms: readonly string[]): string[] {
  return terms.filter((term) => text.includes(term));
}

export function shouldEscalateQuestion(
  input: ConsultationQuestion,
): EscalationDecision {
  const normalizedText = normalizeText(input.text);
  const chemicalMatches = matchTerms(normalizedText, OPERATIONAL_RISK_TERMS);

  if (chemicalMatches.length > 0) {
    return {
      shouldEscalate: true,
      reason: "chemical_or_dosage_risk",
      matchedRiskTerms: chemicalMatches,
    };
  }

  const pestMatches = matchTerms(normalizedText, SEVERE_PEST_TERMS);

  if (pestMatches.length > 0) {
    return {
      shouldEscalate: true,
      reason: "severe_pest_risk",
      matchedRiskTerms: pestMatches,
    };
  }

  if (input.hasReviewedAnswer) {
    return {
      shouldEscalate: false,
      reason: "reviewed_answer_available",
      matchedRiskTerms: [],
    };
  }

  return {
    shouldEscalate: true,
    reason: "no_safe_answer",
    matchedRiskTerms: [],
  };
}
