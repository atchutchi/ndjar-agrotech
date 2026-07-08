import type { AgronomicSourceStatus } from "@ndjar/domain";

type FieldObservedStatus = Extract<AgronomicSourceStatus, "field_observed">;
type EstimatedStatus = Extract<AgronomicSourceStatus, "estimated">;

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

export interface CropPresenceByCommunityGroup {
  id: string;
  communityIds: string[];
  sourceStatus: FieldObservedStatus;
}

export interface CropPresenceByCommunity {
  communityId: string;
  sourceStatus: EstimatedStatus;
  sourceGroupId: string;
}

export interface PilotCrop {
  id: string;
  label: string;
  presenceByCommunityGroup: CropPresenceByCommunityGroup[];
  presenceByCommunity: CropPresenceByCommunity[];
  sourceStatus: AgronomicSourceStatus;
  productionEvidence?: CropProductionEvidence;
  agronomicNotes: CropAgronomicNote[];
}

const sareDonhaCropPresence: CropPresenceByCommunityGroup = {
  id: "sare-donha-crop-presence",
  communityIds: ["sare-donha-1", "sare-donha-2"],
  sourceStatus: "field_observed",
};

const uaneUguiCropPresence: CropPresenceByCommunityGroup = {
  id: "uane-ugui-crop-presence",
  communityIds: ["uane", "ugui"],
  sourceStatus: "field_observed",
};

function expandEstimatedCommunityPresence(
  groups: CropPresenceByCommunityGroup[],
): CropPresenceByCommunity[] {
  return groups.flatMap((group) =>
    group.communityIds.map((communityId) => ({
      communityId,
      sourceStatus: "estimated",
      sourceGroupId: group.id,
    })),
  );
}

export const pilotCrops: PilotCrop[] = [
  {
    id: "arroz",
    label: "Arroz",
    presenceByCommunityGroup: [sareDonhaCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "abobora",
    label: "Abobora",
    presenceByCommunityGroup: [sareDonhaCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "inhame",
    label: "Inhame",
    presenceByCommunityGroup: [sareDonhaCropPresence, uaneUguiCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
      uaneUguiCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "mandioca",
    label: "Mandioca",
    presenceByCommunityGroup: [sareDonhaCropPresence, uaneUguiCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
      uaneUguiCropPresence,
    ]),
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
    presenceByCommunityGroup: [sareDonhaCropPresence, uaneUguiCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
      uaneUguiCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "feijao",
    label: "Feijao",
    presenceByCommunityGroup: [sareDonhaCropPresence, uaneUguiCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
      uaneUguiCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "candja",
    label: "Candja",
    presenceByCommunityGroup: [sareDonhaCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "badjiqui",
    label: "Badjiqui",
    presenceByCommunityGroup: [sareDonhaCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      sareDonhaCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
  {
    id: "batata-doce",
    label: "Batata-doce",
    presenceByCommunityGroup: [uaneUguiCropPresence],
    presenceByCommunity: expandEstimatedCommunityPresence([
      uaneUguiCropPresence,
    ]),
    sourceStatus: "field_observed",
    agronomicNotes: [],
  },
];
