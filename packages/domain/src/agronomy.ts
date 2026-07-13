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
  "strongly-acidic",
  "acidic",
  "slightly-acidic",
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

  if (value < 0 || value > 14) {
    throw new RangeError("pH value must be between 0 and 14");
  }

  if (value < 4.5) {
    return "strongly-acidic";
  }

  if (value < 5.5) {
    return "acidic";
  }

  if (value < 6.5) {
    return "slightly-acidic";
  }

  if (value <= 7.5) {
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
