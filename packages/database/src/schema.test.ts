import { AGRONOMIC_SOURCE_STATUSES } from "@ndjar/domain";
import { describe, expect, it } from "vitest";

import {
  answerTemplates,
  authAccounts,
  calendarTasks,
  communities,
  consultationResponses,
  cropPresence,
  cropPresenceGroupObservations,
  entitlements,
  paymentAttempts,
  plans,
  refreshTokens,
  regions,
  roles,
  soilSamples,
  sourceStatusEnum,
  subscriptions,
  ussdSessions,
  userProfiles,
  userRoles,
  verificationCodes,
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

describe("production auth schema", () => {
  it("exports auth and role tables", () => {
    expect(userProfiles).toBeDefined();
    expect(authAccounts).toBeDefined();
    expect(verificationCodes).toBeDefined();
    expect(refreshTokens).toBeDefined();
    expect(roles).toBeDefined();
    expect(userRoles).toBeDefined();
  });

  it("exports subscription and payment primitives", () => {
    expect(plans).toBeDefined();
    expect(subscriptions).toBeDefined();
    expect(paymentAttempts).toBeDefined();
    expect(entitlements).toBeDefined();
  });
});
