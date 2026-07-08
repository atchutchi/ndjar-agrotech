const CHEMICAL_OR_DOSAGE_TERMS = [
  "dose",
  "dosagem",
  "ureia",
  "quimic",
  "fertiliz",
  "misturar",
] as const;
const SEVERE_PEST_TERMS = [
  "praga grave",
  "infest",
  "morrer",
  "doenca grave",
  "fungicida",
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
  const chemicalMatches = matchTerms(normalizedText, CHEMICAL_OR_DOSAGE_TERMS);

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
    matchedRiskTerms: matchTerms(normalizedText, CHEMICAL_OR_DOSAGE_TERMS),
  };
}
