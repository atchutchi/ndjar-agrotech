import type { AgronomicSourceStatus, SoilSampleRecord } from "@ndjar/domain";
import { createSampleRecord } from "@ndjar/domain";

export interface PilotCommunity {
  id: string;
  name: string;
  areaHectares: number;
  parcelSizeHectares: number;
  observedCropIds: string[];
  productionMode: "organic";
  chemicalUse: "none_reported";
  sourceStatus: AgronomicSourceStatus;
}

export interface PilotRegion {
  id: string;
  regionName: string;
  sectorName: string;
  sourceStatus: AgronomicSourceStatus;
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
    communities: [
      {
        id: "sare-donha-1",
        name: "Sare Donha 1",
        areaHectares: 16,
        parcelSizeHectares: 2,
        observedCropIds: [...sareDonhaCropIds],
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
      {
        id: "sare-donha-2",
        name: "Sare Donha 2",
        areaHectares: 16,
        parcelSizeHectares: 2,
        observedCropIds: [...sareDonhaCropIds],
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
      {
        id: "uane",
        name: "Uane",
        areaHectares: 24,
        parcelSizeHectares: 2,
        observedCropIds: [...uaneUguiCropIds],
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
      {
        id: "ugui",
        name: "Ugui",
        areaHectares: 24,
        parcelSizeHectares: 2,
        observedCropIds: [...uaneUguiCropIds],
        productionMode: "organic",
        chemicalUse: "none_reported",
        sourceStatus: "field_observed",
      },
    ],
    phSamples: [
      createSampleRecord({
        id: "quinara-buba-estimated-ph",
        ph: 6.1,
        status: "example",
        method: "unknown",
        collectedAt: "2026-07-08",
      }),
    ],
  },
];
