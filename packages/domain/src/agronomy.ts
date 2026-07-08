export const AGRONOMIC_SOURCE_STATUSES = [
  "example",
  "estimated",
  "field_observed",
  "self_reported",
  "lab_validated",
  "consultant_reviewed",
] as const;

export type AgronomicSourceStatus = (typeof AGRONOMIC_SOURCE_STATUSES)[number];

export const PH_CLASSES = [
  "acidic",
  "favorable",
  "near-neutral",
  "neutral",
  "alkaline",
] as const;

export type PhClass = (typeof PH_CLASSES)[number];
export type PhMethod = "water" | "calcium_chloride" | "unknown";

export interface SoilSampleInput {
  id: string;
  ph: number;
  status: AgronomicSourceStatus;
  method: PhMethod;
  collectedAt: string;
}

export interface SoilSampleRecord extends SoilSampleInput {
  phClass: PhClass;
}

export function classifyPhValue(value: number): PhClass {
  if (!Number.isFinite(value)) {
    throw new RangeError("pH value must be finite");
  }

  if (value < 5.6) {
    return "acidic";
  }

  if (value <= 6.5) {
    return "favorable";
  }

  if (value < 7) {
    return "near-neutral";
  }

  if (value === 7) {
    return "neutral";
  }

  return "alkaline";
}

export function createSampleRecord(input: SoilSampleInput): SoilSampleRecord {
  return {
    ...input,
    phClass: classifyPhValue(input.ph),
  };
}
