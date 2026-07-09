import type { AgronomicSourceStatus, SoilSampleRecord } from "@ndjar/domain";
import { createSampleRecord } from "@ndjar/domain";

type FieldObservedStatus = Extract<AgronomicSourceStatus, "field_observed">;
type EstimatedStatus = Extract<AgronomicSourceStatus, "estimated">;

export interface PilotCommunityAreaGroup {
  id: string;
  communityIds: string[];
  areaHectares: number;
  parcelSizeHectares: number;
  sourceStatus: FieldObservedStatus;
}

export interface PilotCommunity {
  id: string;
  name: string;
  areaHectares: number;
  areaHectaresSourceStatus: EstimatedStatus;
  areaHectaresSourceGroupId: string;
  parcelSizeHectares: number;
  cropIds: string[];
  cropPresenceSourceStatus: EstimatedStatus;
  cropPresenceSourceGroupId: string;
  productionMode: "organic";
  chemicalUse: "none_reported";
  sourceStatus: AgronomicSourceStatus;
}

export interface PilotRegion {
  id: string;
  regionName: string;
  sectorName: string;
  sourceStatus: AgronomicSourceStatus;
  communityAreaGroups: PilotCommunityAreaGroup[];
  communities: PilotCommunity[];
  phSamples: SoilSampleRecord[];
}

const sareDonhaCropIds = [
  "arroz",
  "abobora",
  "inhame",
  "mandioca",
  "milho",
  "feijao",
  "candja",
  "badjiqui",
] as const;

const uaneUguiCropIds = [
  "inhame",
  "mandioca",
  "milho",
  "feijao",
  "batata-doce",
] as const;

export const pilotSouthRegions: PilotRegion[] = [
  {
    id: "quinara-buba-pilot",
    regionName: "Quinara",
    sectorName: "Buba",
    sourceStatus: "field_observed",
    communityAreaGroups: [
      {
        id: "sare-donha-area-group",
        communityIds: ["sare-donha-1", "sare-donha-2"],
        areaHectares: 32,
        parcelSizeHectares: 2,
        sourceStatus: "field_observed",
      },
      {
        id: "uane-ugui-area-group",
        communityIds: ["uane", "ugui"],
        areaHectares: 48,
        parcelSizeHectares: 2,
        sourceStatus: "field_observed",
      },
    ],
    communities: [
      {
        id: "sare-donha-1",
        name: "Sare Donha 1",
        areaHectares: 16,
        areaHectaresSourceStatus: "estimated",
        areaHectaresSourceGroupId: "sare-donha-area-group",
        parcelSizeHectares: 2,
        cropIds: [...sareDonhaCropIds],
        cropPresenceSourceStatus: "estimated",
        cropPresenceSourceGroupId: "sare-donha-crop-presence",
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
      {
        id: "sare-donha-2",
        name: "Sare Donha 2",
        areaHectares: 16,
        areaHectaresSourceStatus: "estimated",
        areaHectaresSourceGroupId: "sare-donha-area-group",
        parcelSizeHectares: 2,
        cropIds: [...sareDonhaCropIds],
        cropPresenceSourceStatus: "estimated",
        cropPresenceSourceGroupId: "sare-donha-crop-presence",
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
      {
        id: "uane",
        name: "Uane",
        areaHectares: 24,
        areaHectaresSourceStatus: "estimated",
        areaHectaresSourceGroupId: "uane-ugui-area-group",
        parcelSizeHectares: 2,
        cropIds: [...uaneUguiCropIds],
        cropPresenceSourceStatus: "estimated",
        cropPresenceSourceGroupId: "uane-ugui-crop-presence",
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
      {
        id: "ugui",
        name: "Ugui",
        areaHectares: 24,
        areaHectaresSourceStatus: "estimated",
        areaHectaresSourceGroupId: "uane-ugui-area-group",
        parcelSizeHectares: 2,
        cropIds: [...uaneUguiCropIds],
        cropPresenceSourceStatus: "estimated",
        cropPresenceSourceGroupId: "uane-ugui-crop-presence",
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
    ],
    phSamples: [
      createSampleRecord({
        id: "synthetic-example-ph-not-field-sample",
        ph: 6.1,
        status: "example",
        method: "unknown",
        collectedAt: "synthetic-example-not-collected",
      }),
    ],
  },
];
