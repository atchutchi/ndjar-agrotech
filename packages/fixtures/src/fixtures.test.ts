import { describe, expect, it } from "vitest";

import {
  pilotCalendarTasks,
  pilotCrops,
  pilotSouthRegions,
} from "./index.js";

describe("pilotSouthRegions", () => {
  it("keeps the southern pilot communities and cautious pH status explicit", () => {
    expect(pilotSouthRegions).toHaveLength(1);

    expect(pilotSouthRegions[0]).toMatchObject({
      id: "quinara-buba-pilot",
      regionName: "Quinara",
      sectorName: "Buba",
      sourceStatus: "field_observed",
      communities: [
        {
          id: "sare-donha-1",
          name: "Sare Donha 1",
          sourceStatus: "field_observed",
        },
        {
          id: "sare-donha-2",
          name: "Sare Donha 2",
          sourceStatus: "field_observed",
        },
        {
          id: "uane",
          name: "Uane",
          sourceStatus: "field_observed",
        },
        {
          id: "ugui",
          name: "Ugui",
          sourceStatus: "field_observed",
        },
      ],
    });

    expect(
      pilotSouthRegions.flatMap((region) => region.phSamples).map((sample) => sample.status),
    ).toEqual(["example"]);
  });
});

describe("pilotCrops", () => {
  it("captures observed crops and keeps mandioca production safely labelled", () => {
    expect(pilotCrops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mandioca",
          sourceStatus: "field_observed",
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
        expect.objectContaining({ id: "arroz", sourceStatus: "field_observed" }),
        expect.objectContaining({ id: "batata-doce", sourceStatus: "field_observed" }),
      ]),
    );
  });
});

describe("pilotCalendarTasks", () => {
  it("covers the September to August cycle and keeps tasks estimated", () => {
    expect(pilotCalendarTasks[0]?.month).toBe("September");
    expect(pilotCalendarTasks.at(-1)?.month).toBe("August");
    expect(new Set(pilotCalendarTasks.map((task) => task.sourceStatus))).toEqual(
      new Set(["estimated"]),
    );
    expect(new Set(pilotCalendarTasks.map((task) => task.taskType))).toEqual(
      new Set(["preparation", "planting", "weeding", "harvest", "threshing"]),
    );
  });
});
