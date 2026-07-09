import { describe, expect, it } from "vitest";

import { buildPilotOverview } from "./pilot-summary";

describe("buildPilotOverview", () => {
  it("summarises the Quinara/Buba pilot from fixtures", () => {
    const overview = buildPilotOverview();

    expect(overview.locationLabel).toBe("Quinara / Buba");
    expect(overview.communityCount).toBe(4);
    expect(overview.cropCount).toBe(9);
    expect(overview.sampleCount).toBe(1);
    expect(overview.totalAreaHectares).toBe(80);
    expect(overview.communities).toEqual([
      "Sare Donha 1",
      "Sare Donha 2",
      "Uane",
      "Ugui",
    ]);
  });
});
