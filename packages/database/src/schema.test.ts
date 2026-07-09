import { AGRONOMIC_SOURCE_STATUSES } from "@ndjar/domain";
import { describe, expect, it } from "vitest";

import {
  answerTemplates,
  calendarTasks,
  communities,
  consultationResponses,
  cropPresence,
  cropPresenceGroupObservations,
  regions,
  soilSamples,
  sourceStatusEnum,
  ussdSessions,
} from "./schema.js";

describe("database schema", () => {
  it("keeps the domain source statuses available to persisted agronomic data", () => {
    expect(sourceStatusEnum.enumValues).toEqual([...AGRONOMIC_SOURCE_STATUSES]);

    expect(regions).toHaveProperty("sourceStatus");
    expect(communities).toHaveProperty("areaHectaresSourceStatus");
    expect(cropPresence).toHaveProperty("sourceStatus");
    expect(cropPresenceGroupObservations).toHaveProperty("sourceStatus");
    expect(soilSamples).toHaveProperty("sourceStatus");
    expect(calendarTasks).toHaveProperty("sourceStatus");
    expect(answerTemplates).toHaveProperty("sourceStatus");
    expect(consultationResponses).toHaveProperty("sourceStatus");
  });

  it("models offline sync and future USSD entry points without requiring integrations", () => {
    expect(communities).toHaveProperty("offlineClientId");
    expect(communities).toHaveProperty("syncVersion");
    expect(soilSamples).toHaveProperty("offlineClientId");
    expect(calendarTasks).toHaveProperty("lastSyncedAt");
    expect(ussdSessions).toHaveProperty("route");
    expect(ussdSessions).toHaveProperty("currentScreen");
    expect(ussdSessions).toHaveProperty("status");
  });
});
