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
  userRoleEnum,
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

  it("alinha todos os papeis do dominio com o enum persistido", () => {
    expect(userRoleEnum.enumValues).toEqual([
      "farmer",
      "agricultural_doctor",
      "admin",
      "super_admin",
    ]);
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

  it("persiste familias e cadeia de rotacao dos refresh tokens", () => {
    const config = getTableConfig(refreshTokens);

    expect(refreshTokens).toHaveProperty("familyId");
    expect(refreshTokens).toHaveProperty("parentTokenId");
    expect(refreshTokens).toHaveProperty("consumedAt");
    expect(
      config.indexes.some((index) =>
        index.config.columns.some(
          (column) => "name" in column && column.name === "family_id",
        ),
      ),
    ).toBe(true);
  });

  it("impede entitlements de apontarem para subscricoes de outro utilizador", () => {
    const entitlementConfig = getTableConfig(entitlements);
    const subscriptionConfig = getTableConfig(subscriptions);

    expect(entitlements.subscriptionId.notNull).toBe(true);
    expect(
      subscriptionConfig.indexes.some(
        (index) =>
          index.config.unique &&
          index.config.columns
            .map((column) => ("name" in column ? column.name : undefined))
            .join(",") === "id,user_id",
      ),
    ).toBe(true);
    expect(
      entitlementConfig.foreignKeys.some((foreignKey) => {
        const reference = foreignKey.reference();
        return (
          reference.columns.map((column) => column.name).join(",") ===
            "subscription_id,user_id" &&
          reference.foreignColumns
            .map((column) => column.name)
            .join(",") === "id,user_id"
        );
      }),
    ).toBe(true);
  });

  it("requires metadata for payment attempts and audit logs", () => {
    expect(paymentAttempts.metadata.notNull).toBe(true);
    expect(auditLogs.metadata.notNull).toBe(true);
  });
});
