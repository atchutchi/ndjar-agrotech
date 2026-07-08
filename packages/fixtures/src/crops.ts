import type { AgronomicSourceStatus } from "@ndjar/domain";

export interface CropProductionEvidence {
  annualBags: {
    minimum: number;
    unit: "bags";
  };
  bagWeightKg: number;
  useCases: string[];
  sourceStatus: AgronomicSourceStatus;
}

export interface CropAgronomicNote {
  communityId: string;
  note: string;
  sourceStatus: AgronomicSourceStatus;
}

export interface PilotCrop {
  id: string;
  label: string;
  observedInCommunityIds: string[];
  sourceStatus: AgronomicSourceStatus;
  productionEvidence?: CropProductionEvidence;
  agronomicNotes: CropAgronomicNote[];
}

export const pilotCrops: PilotCrop[] = [
  {
    id: "arroz",
    label: "Arroz",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "abobora",
    label: "Abobora",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "inhame",
    label: "Inhame",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2", "uane", "ugui"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "mandioca",
    label: "Mandioca",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2", "uane", "ugui"],
    sourceStatus: "field_observed",
    productionEvidence: {
      annualBags: {
        minimum: 20,
        unit: "bags",
      },
      bagWeightKg: 200,
      useCases: ["sale", "local_consumption"],
      sourceStatus: "self_reported",
    },
    agronomicNotes: [
      {
        communityId: "sare-donha-1",
        note: "One parcel no longer yields cassava as it previously did.",
        sourceStatus: "field_observed",
      },
    ],
  },
  {
    id: "milho",
    label: "Milho",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2", "uane", "ugui"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "feijao",
    label: "Feijao",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2", "uane", "ugui"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "candja",
    label: "Candja",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "badjiqui",
    label: "Badjiqui",
    observedInCommunityIds: ["sare-donha-1", "sare-donha-2"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "batata-doce",
    label: "Batata-doce",
    observedInCommunityIds: ["uane", "ugui"],
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
];
