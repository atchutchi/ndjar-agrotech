import { AGRONOMIC_SOURCE_STATUSES } from "@ndjar/domain";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  auditLogs,
  answerTemplates,
  answerTemplateVersions,
  authAccounts,
  authRateLimits,
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
  seedManifests,
  seedTombstones,
  soilSamples,
  sourceStatusEnum,
  subscriptions,
  ussdSessions,
  userProfiles,
  userRoleEnum,
  userRoles,
  users,
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
    expect(answerTemplateVersions).toHaveProperty("sourceStatus");
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
    const dialect = new PgDialect();

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
    expect(
      config.foreignKeys.some((foreignKey) => {
        const reference = foreignKey.reference();
        return (
          reference.columns.map((column) => column.name).join(",") ===
            "parent_token_id,family_id,user_id" &&
          reference.foreignColumns.map((column) => column.name).join(",") ===
            "id,family_id,user_id"
        );
      }),
    ).toBe(true);
    expect(
      config.foreignKeys.some((foreignKey) => {
        const reference = foreignKey.reference();
        return (
          reference.columns.map((column) => column.name).join(",") ===
            "family_id" &&
          reference.foreignColumns.map((column) => column.name).join(",") ===
            "id"
        );
      }),
    ).toBe(true);
    expect(
      config.indexes.some(
        (index) =>
          index.config.unique &&
          index.config.columns
            .map((column) => ("name" in column ? column.name : undefined))
            .join(",") === "id,family_id,user_id",
      ),
    ).toBe(true);
    expect(
      config.checks.some((constraint) =>
        dialect
          .sqlToQuery(constraint.value)
          .sql.includes(
            '"parent_token_id" is not null or "refresh_tokens"."family_id" = "refresh_tokens"."id"',
          ),
      ),
    ).toBe(true);
  });

  it("uses user_roles as the only persisted role authority", () => {
    expect(users).not.toHaveProperty("role");
  });

  it("indexa pesquisas operacionais de autenticacao", () => {
    const indexedNames = [
      authAccounts,
      userProfiles,
      verificationCodes,
    ].flatMap((table) =>
      getTableConfig(table).indexes.map((index) =>
        index.config.columns
          .map((column) => ("name" in column ? column.name : undefined))
          .join(","),
      ),
    );

    expect(indexedNames).toEqual(
      expect.arrayContaining([
        "user_id",
        "phone_number_hash",
        "target_hash,purpose,consumed_at,expires_at",
      ]),
    );
  });

  it("persiste rate limits partilhados e indexa a sua expiracao", () => {
    const config = getTableConfig(authRateLimits);

    expect(authRateLimits.key.primary).toBe(true);
    expect(authRateLimits.requestCount.notNull).toBe(true);
    expect(authRateLimits.expiresAt.notNull).toBe(true);
    expect(
      config.indexes.some((index) =>
        index.config.columns.some(
          (column) => "name" in column && column.name === "expires_at",
        ),
      ),
    ).toBe(true);
  });

  it("persiste manifestos versionados para seeds reproduziveis", () => {
    expect(seedManifests.key.primary).toBe(true);
    expect(seedManifests.version.notNull).toBe(true);
    expect(seedManifests.contentHash.notNull).toBe(true);
    expect(seedManifests.entityIds.notNull).toBe(true);
    expect(seedTombstones.removedInVersion.notNull).toBe(true);
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
          reference.foreignColumns.map((column) => column.name).join(",") ===
            "id,user_id"
        );
      }),
    ).toBe(true);
  });

  it("requires subscription periods to be positive", () => {
    const config = getTableConfig(subscriptions);
    const dialect = new PgDialect();

    expect(
      config.checks.some((constraint) =>
        dialect
          .sqlToQuery(constraint.value)
          .sql.includes(
            '"subscriptions"."starts_at" < "subscriptions"."expires_at"',
          ),
      ),
    ).toBe(true);
  });

  it("requires metadata for payment attempts and audit logs", () => {
    expect(paymentAttempts.metadata.notNull).toBe(true);
    expect(auditLogs.metadata.notNull).toBe(true);
  });
});
