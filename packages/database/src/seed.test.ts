import {
  pilotCalendarTasks,
  pilotCrops,
  pilotSouthRegions,
} from "@ndjar/fixtures";
import { describe, expect, it } from "vitest";

import {
  seedCalendarTasks,
  seedCommunities,
  seedCommunityGroups,
  seedCropPresence,
  seedCropPresenceGroupObservations,
  seedCropProductionEvidence,
  seedCrops,
  seedRegions,
  seedSoilSamples,
} from "./seed.js";

describe("database seed data", () => {
  it("maps the pilot fixtures into stable database insert records", () => {
    expect(seedRegions).toHaveLength(pilotSouthRegions.length);
    expect(seedCrops).toHaveLength(pilotCrops.length);
    expect(seedCalendarTasks).toHaveLength(pilotCalendarTasks.length);
  });

  it("preserves grouped, estimated, example and self-reported source statuses", () => {
    expect(seedCommunityGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "sare-donha-area-group",
          sourceStatus: "field_observed",
        }),
      ]),
    );

    expect(seedCommunities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "sare-donha-1",
          areaHectaresSourceStatus: "estimated",
        }),
      ]),
    );

    expect(seedCropPresenceGroupObservations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cropId: "mandioca",
          groupId: "sare-donha-crop-presence",
          sourceStatus: "field_observed",
        }),
      ]),
    );

    expect(seedCropPresence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cropId: "mandioca",
          communityId: "sare-donha-1",
          sourceStatus: "estimated",
          sourceGroupId: "sare-donha-crop-presence",
        }),
      ]),
    );

    expect(seedSoilSamples).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "synthetic-example-ph-not-field-sample",
          sourceStatus: "example",
        }),
      ]),
    );

    expect(seedCropProductionEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cropId: "mandioca",
          sourceStatus: "self_reported",
        }),
      ]),
    );
  });
});
