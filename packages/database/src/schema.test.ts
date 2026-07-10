import { AGRONOMIC_SOURCE_STATUSES } from "@ndjar/domain";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  auditLogs,
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

  it("enforces unique authentication identities and role assignments", () => {
    const authAccountIndexes = getTableConfig(authAccounts).indexes;
    const userRoleIndexes = getTableConfig(userRoles).indexes;

    expect(
      authAccountIndexes.some(
        (index) =>
          index.config.unique &&
          index.config.columns
            .map((column) => ("name" in column ? column.name : undefined))
            .join(",") === "provider,login_identifier_hash",
      ),
    ).toBe(true);
    expect(
      userRoleIndexes.some(
        (index) =>
          index.config.unique &&
          index.config.columns
            .map((column) => ("name" in column ? column.name : undefined))
            .join(",") === "user_id,role_id",
      ),
    ).toBe(true);
  });

  it("requires metadata for payment attempts and audit logs", () => {
    expect(paymentAttempts.metadata.notNull).toBe(true);
    expect(auditLogs.metadata.notNull).toBe(true);
  });
});
