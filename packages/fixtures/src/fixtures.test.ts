import { describe, expect, it } from "vitest";

import { pilotCalendarTasks, pilotCrops, pilotSouthRegions } from "./index.js";

describe("pilotSouthRegions", () => {
  it("keeps grouped area evidence separate from inferred community splits", () => {
    expect(pilotSouthRegions).toHaveLength(1);

    const region = pilotSouthRegions[0];

    expect(region).toMatchObject({
      id: "quinara-buba-pilot",
      regionName: "Quinara",
      sectorName: "Buba",
      sourceStatus: "field_observed",
      communityAreaGroups: [
        {
          id: "sare-donha-area-group",
          communityIds: ["sare-donha-1", "sare-donha-2"],
          areaHectares: 32,
          sourceStatus: "field_observed",
        },
        {
          id: "uane-ugui-area-group",
          communityIds: ["uane", "ugui"],
          areaHectares: 48,
          sourceStatus: "field_observed",
        },
      ],
      communities: [
        {
          id: "sare-donha-1",
          name: "Sare Donha 1",
          sourceStatus: "field_observed",
          areaHectares: 16,
          areaHectaresSourceStatus: "estimated",
          areaHectaresSourceGroupId: "sare-donha-area-group",
        },
        {
          id: "sare-donha-2",
          name: "Sare Donha 2",
          sourceStatus: "field_observed",
          areaHectares: 16,
          areaHectaresSourceStatus: "estimated",
          areaHectaresSourceGroupId: "sare-donha-area-group",
        },
        {
          id: "uane",
          name: "Uane",
          sourceStatus: "field_observed",
          areaHectares: 24,
          areaHectaresSourceStatus: "estimated",
          areaHectaresSourceGroupId: "uane-ugui-area-group",
        },
        {
          id: "ugui",
          name: "Ugui",
          sourceStatus: "field_observed",
          areaHectares: 24,
          areaHectaresSourceStatus: "estimated",
          areaHectaresSourceGroupId: "uane-ugui-area-group",
        },
      ],
    });

    const communityAreaStatuses = region?.communities.map(
      (community) => community.areaHectaresSourceStatus,
    );

    expect(new Set(communityAreaStatuses)).toEqual(new Set(["estimated"]));
  });

  it("keeps the pH fixture clearly marked as a synthetic example", () => {
    const phSamples = pilotSouthRegions.flatMap((region) => region.phSamples);

    expect(
      phSamples.map((sample) => ({
        id: sample.id,
        status: sample.status,
        method: sample.method,
        collectedAt: sample.collectedAt,
      })),
    ).toEqual([
      {
        id: "synthetic-example-ph-not-field-sample",
        status: "example",
        method: "unknown",
        collectedAt: "synthetic-example-not-collected",
      },
    ]);
  });
});

describe("pilotCrops", () => {
  it("keeps grouped crop presence observed and individual presence estimated", () => {
    expect(pilotCrops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mandioca",
          sourceStatus: "field_observed",
          presenceByCommunityGroup: expect.arrayContaining([
            expect.objectContaining({
              id: "sare-donha-crop-presence",
              communityIds: ["sare-donha-1", "sare-donha-2"],
              sourceStatus: "field_observed",
            }),
            expect.objectContaining({
              id: "uane-ugui-crop-presence",
              communityIds: ["uane", "ugui"],
              sourceStatus: "field_observed",
            }),
          ]),
          presenceByCommunity: expect.arrayContaining([
            expect.objectContaining({
              communityId: "sare-donha-1",
              sourceStatus: "estimated",
              sourceGroupId: "sare-donha-crop-presence",
            }),
            expect.objectContaining({
              communityId: "ugui",
              sourceStatus: "estimated",
              sourceGroupId: "uane-ugui-crop-presence",
            }),
          ]),
          productionEvidence: expect.objectContaining({
            annualBags: {
              minimum: 20,
              unit: "bags",
            },
            bagWeightKg: 200,
            sourceStatus: "self_reported",
          }),
          agronomicNotes: expect.arrayContaining([
            expect.objectContaining({
              communityId: "sare-donha-1",
              sourceStatus: "field_observed",
            }),
          ]),
        }),
        expect.objectContaining({
          id: "arroz",
          sourceStatus: "field_observed",
          presenceByCommunityGroup: [
            expect.objectContaining({
              communityIds: ["sare-donha-1", "sare-donha-2"],
              sourceStatus: "field_observed",
            }),
          ],
          presenceByCommunity: expect.arrayContaining([
            expect.objectContaining({
              communityId: "sare-donha-1",
              sourceStatus: "estimated",
            }),
          ]),
        }),
        expect.objectContaining({
          id: "batata-doce",
          sourceStatus: "field_observed",
          presenceByCommunityGroup: [
            expect.objectContaining({
              communityIds: ["uane", "ugui"],
              sourceStatus: "field_observed",
            }),
          ],
          presenceByCommunity: expect.arrayContaining([
            expect.objectContaining({
              communityId: "uane",
              sourceStatus: "estimated",
            }),
          ]),
        }),
      ]),
    );

    expect(pilotCrops.some((crop) => "observedInCommunityIds" in crop)).toBe(
      false,
    );
  });
});

describe("pilotCalendarTasks", () => {
  it("covers the September to August cycle and keeps tasks estimated", () => {
    expect(pilotCalendarTasks[0]?.month).toBe("September");
    expect(pilotCalendarTasks.at(-1)?.month).toBe("August");
    expect(
      new Set(pilotCalendarTasks.map((task) => task.sourceStatus)),
    ).toEqual(new Set(["estimated"]));
    expect(new Set(pilotCalendarTasks.map((task) => task.taskType))).toEqual(
      new Set(["preparation", "planting", "weeding", "harvest", "threshing"]),
    );
  });
});
