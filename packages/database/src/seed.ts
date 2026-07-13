import {
  pilotCalendarTasks,
  pilotCrops,
  pilotSouthRegions,
} from "@ndjar/fixtures";

import {
  agronomicSources,
  calendarTasks,
  communities,
  communityGroupMembers,
  communityGroups,
  cropAgronomicNotes,
  cropPresence,
  cropPresenceGroupObservations,
  cropProductionEvidence,
  crops,
  regions,
  soilSamples,
} from "./schema.js";

type AgronomicSourceInsert = typeof agronomicSources.$inferInsert;
type RegionInsert = typeof regions.$inferInsert;
type CommunityGroupInsert = typeof communityGroups.$inferInsert;
type CommunityGroupMemberInsert = typeof communityGroupMembers.$inferInsert;
type CommunityInsert = typeof communities.$inferInsert;
type CropInsert = typeof crops.$inferInsert;
type CropPresenceGroupObservationInsert =
  typeof cropPresenceGroupObservations.$inferInsert;
type CropPresenceInsert = typeof cropPresence.$inferInsert;
type CropProductionEvidenceInsert = typeof cropProductionEvidence.$inferInsert;
type CropAgronomicNoteInsert = typeof cropAgronomicNotes.$inferInsert;
type SoilSampleInsert = typeof soilSamples.$inferInsert;
type CalendarTaskInsert = typeof calendarTasks.$inferInsert;

function getPilotRegionId(): string {
  const [region] = pilotSouthRegions;

  if (!region) {
    throw new Error(
      "Cannot build database seed without a pilot region fixture.",
    );
  }

  return region.id;
}

const pilotRegionId = getPilotRegionId();

const PILOT_DIAGNOSTIC_SOURCE_ID = "pilot-south-diagnostic-v1";
const PILOT_CALENDAR_SOURCE_ID = "agricultural-calendar-v1";
const SYNTHETIC_PH_SOURCE_ID = "synthetic-ph-example-v1";

export const seedAgronomicSources: AgronomicSourceInsert[] = [
  {
    id: PILOT_DIAGNOSTIC_SOURCE_ID,
    documentTitle: "Sumario Executivo N'djar e diagnostico do sul",
    documentDateText: "Data nao indicada no documento",
    responsibleName: "N'djar",
    confidence: "medium",
    version: 1,
  },
  {
    id: PILOT_CALENDAR_SOURCE_ID,
    documentTitle: "Calendario Agricultural",
    documentDateText: "Data nao indicada no ficheiro",
    responsibleName: "N'djar",
    confidence: "unknown",
    version: 1,
  },
  {
    id: SYNTHETIC_PH_SOURCE_ID,
    documentTitle: "Amostra sintetica de pH para demonstracao",
    documentDateText: "2026-07-08",
    responsibleName: "N'djar",
    confidence: "low",
    version: 1,
  },
];

function uniqueById<T extends { id: string }>(records: T[]): T[] {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

export const seedRegions: RegionInsert[] = pilotSouthRegions.map((region) => ({
  id: region.id,
  regionName: region.regionName,
  sectorName: region.sectorName,
  sourceStatus: region.sourceStatus,
  sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
}));

const areaCommunityGroups: CommunityGroupInsert[] = pilotSouthRegions.flatMap(
  (region) =>
    region.communityAreaGroups.map((group) => ({
      id: group.id,
      regionId: region.id,
      groupType: "area",
      label: group.id,
      areaHectares: group.areaHectares,
      parcelSizeHectares: group.parcelSizeHectares,
      sourceStatus: group.sourceStatus,
      sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
    })),
);

const cropPresenceCommunityGroups: CommunityGroupInsert[] = pilotCrops.flatMap(
  (crop) =>
    crop.presenceByCommunityGroup.map((group) => ({
      id: group.id,
      regionId: pilotRegionId,
      groupType: "crop_presence",
      label: group.id,
      sourceStatus: group.sourceStatus,
      sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
    })),
);

export const seedCommunityGroups: CommunityGroupInsert[] = uniqueById([
  ...areaCommunityGroups,
  ...cropPresenceCommunityGroups,
]);

export const seedCommunities: CommunityInsert[] = pilotSouthRegions.flatMap(
  (region) =>
    region.communities.map((community) => ({
      id: community.id,
      regionId: region.id,
      name: community.name,
      areaHectares: community.areaHectares,
      areaHectaresSourceStatus: community.areaHectaresSourceStatus,
      areaHectaresSourceGroupId: community.areaHectaresSourceGroupId,
      parcelSizeHectares: community.parcelSizeHectares,
      productionMode: community.productionMode,
      chemicalUse: community.chemicalUse,
      sourceStatus: community.sourceStatus,
      sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
    })),
);

const areaGroupMembers: CommunityGroupMemberInsert[] =
  pilotSouthRegions.flatMap((region) =>
    region.communityAreaGroups.flatMap((group) =>
      group.communityIds.map((communityId) => ({
        id: `${group.id}:${communityId}`,
        groupId: group.id,
        communityId,
        sourceStatus: group.sourceStatus,
        sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
      })),
    ),
  );

const cropPresenceGroupMembers: CommunityGroupMemberInsert[] =
  pilotCrops.flatMap((crop) =>
    crop.presenceByCommunityGroup.flatMap((group) =>
      group.communityIds.map((communityId) => ({
        id: `${group.id}:${communityId}`,
        groupId: group.id,
        communityId,
        sourceStatus: group.sourceStatus,
        sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
      })),
    ),
  );

export const seedCommunityGroupMembers: CommunityGroupMemberInsert[] =
  uniqueById([...areaGroupMembers, ...cropPresenceGroupMembers]);

export const seedCrops: CropInsert[] = pilotCrops.map((crop) => ({
  id: crop.id,
  label: crop.label,
  sourceStatus: crop.sourceStatus,
  sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
}));

export const seedCropPresenceGroupObservations: CropPresenceGroupObservationInsert[] =
  pilotCrops.flatMap((crop) =>
    crop.presenceByCommunityGroup.map((group) => ({
      id: `${crop.id}:${group.id}`,
      cropId: crop.id,
      groupId: group.id,
      sourceStatus: group.sourceStatus,
      sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
    })),
  );

export const seedCropPresence: CropPresenceInsert[] = pilotCrops.flatMap(
  (crop) =>
    crop.presenceByCommunity.map((presence) => ({
      id: `${crop.id}:${presence.communityId}`,
      cropId: crop.id,
      communityId: presence.communityId,
      sourceStatus: presence.sourceStatus,
      sourceGroupId: presence.sourceGroupId,
      sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
    })),
);

export const seedCropProductionEvidence: CropProductionEvidenceInsert[] =
  pilotCrops.flatMap((crop) =>
    crop.productionEvidence
      ? [
          {
            id: `${crop.id}:production-evidence`,
            cropId: crop.id,
            annualBagsMinimum: crop.productionEvidence.annualBags.minimum,
            annualBagsUnit: crop.productionEvidence.annualBags.unit,
            bagWeightKg: crop.productionEvidence.bagWeightKg,
            useCases: crop.productionEvidence.useCases,
            sourceStatus: crop.productionEvidence.sourceStatus,
            sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
          },
        ]
      : [],
  );

export const seedCropAgronomicNotes: CropAgronomicNoteInsert[] =
  pilotCrops.flatMap((crop) =>
    crop.agronomicNotes.map((note, index) => ({
      id: `${crop.id}:note:${note.communityId}:${index + 1}`,
      cropId: crop.id,
      communityId: note.communityId,
      note: note.note,
      sourceStatus: note.sourceStatus,
      sourceId: PILOT_DIAGNOSTIC_SOURCE_ID,
    })),
  );

export const seedSoilSamples: SoilSampleInsert[] = pilotSouthRegions.flatMap(
  (region) =>
    region.phSamples.map((sample) => ({
      id: sample.id,
      regionId: region.id,
      ph: sample.ph,
      phClass: sample.phClass,
      phMethod: sample.method,
      collectedAtText: sample.collectedAt,
      sourceStatus: sample.status,
      sourceId:
        sample.id === "synthetic-example-ph-not-field-sample"
          ? SYNTHETIC_PH_SOURCE_ID
          : PILOT_DIAGNOSTIC_SOURCE_ID,
    })),
);

export const seedCalendarTasks: CalendarTaskInsert[] = pilotCalendarTasks.map(
  (task) => ({
    id: task.id,
    regionId: pilotRegionId,
    month: task.month,
    season: task.season,
    taskType: task.taskType,
    summary: task.summary,
    sourceStatus: task.sourceStatus,
    sourceId: PILOT_CALENDAR_SOURCE_ID,
  }),
);

export const pilotSeedData = {
  agronomicSources: seedAgronomicSources,
  regions: seedRegions,
  communityGroups: seedCommunityGroups,
  communityGroupMembers: seedCommunityGroupMembers,
  communities: seedCommunities,
  crops: seedCrops,
  cropPresenceGroupObservations: seedCropPresenceGroupObservations,
  cropPresence: seedCropPresence,
  cropProductionEvidence: seedCropProductionEvidence,
  cropAgronomicNotes: seedCropAgronomicNotes,
  soilSamples: seedSoilSamples,
  calendarTasks: seedCalendarTasks,
} as const;

export const PILOT_SEED_ORDER = [
  "agronomicSources",
  "regions",
  "communityGroups",
  "communities",
  "communityGroupMembers",
  "crops",
  "cropPresenceGroupObservations",
  "cropPresence",
  "cropProductionEvidence",
  "cropAgronomicNotes",
  "soilSamples",
  "calendarTasks",
] as const;
