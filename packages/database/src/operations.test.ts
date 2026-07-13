import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readPackageJson(path: string): { scripts: Record<string, string> } {
  return JSON.parse(readFileSync(path, "utf8")) as {
    scripts: Record<string, string>;
  };
}

describe("database operations", () => {
  it("provides reproducible migration and seed commands", () => {
    const databasePackageJson = readPackageJson(
      resolve(import.meta.dirname, "../package.json"),
    );
    const apiPackageJson = readPackageJson(
      resolve(import.meta.dirname, "../../../apps/api/package.json"),
    );
    expect(databasePackageJson.scripts).toMatchObject({
      "db:migrate": "drizzle-kit migrate",
    });
    expect(apiPackageJson.scripts).toMatchObject({
      "db:create-local-admin": "tsx src/database/create-local-admin.ts",
      "db:seed": "tsx src/database/run-seed.ts",
    });
  });

  it("does not fall back to an implicit database for migrations", () => {
    const config = readFileSync(
      resolve(import.meta.dirname, "../drizzle.config.ts"),
      "utf8",
    );

    expect(config).not.toContain("postgres://localhost");
    expect(config).toContain("DATABASE_URL is required");
  });

  it("enables PostGIS in the first migration", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0000_initial_schema.sql"),
      "utf8",
    );

    expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS postgis");
    expect(
      migration.indexOf("CREATE EXTENSION IF NOT EXISTS postgis"),
    ).toBeLessThan(migration.indexOf("CREATE TABLE"));
  });

  it("creates the subscription ownership key before entitlements references it", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0000_initial_schema.sql"),
      "utf8",
    );
    const ownershipKey =
      'CREATE UNIQUE INDEX "subscriptions_id_user_id_unique"';
    const entitlementForeignKey =
      'ADD CONSTRAINT "entitlements_subscription_user_fk"';

    expect(migration).toContain(ownershipKey);
    expect(migration).toContain(entitlementForeignKey);
    expect(migration.indexOf(ownershipKey)).toBeLessThan(
      migration.indexOf(entitlementForeignKey),
    );
  });

  it("preflights incompatible pH rows before adding strict coherence", () => {
    const migration = readFileSync(
      resolve(
        import.meta.dirname,
        "../drizzle/0001_auth_agronomic_integrity.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("RAISE EXCEPTION");
    expect(migration).toContain("soil_samples");
    expect(migration).toContain("corrija os dados antes de migrar");
  });

  it("migrates the shared authentication rate limit storage", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0002_auth_rate_limits.sql"),
      "utf8",
    );

    expect(migration).toContain('CREATE TABLE "auth_rate_limits"');
    expect(migration).toContain('"key" text PRIMARY KEY NOT NULL');
    expect(migration).toContain('"request_count" integer DEFAULT 1 NOT NULL');
    expect(migration).toContain(
      '"expires_at" timestamp with time zone NOT NULL',
    );
    expect(migration).toContain(
      'CREATE INDEX "auth_rate_limits_expires_at_idx"',
    );
  });

  it("enforces immutable reviewed clinical versions and response snapshots", () => {
    const migration = readFileSync(
      resolve(
        import.meta.dirname,
        "../drizzle/0003_clinical_review_integrity.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    expect(migration).toContain('CREATE TABLE "answer_template_versions"');
    expect(migration).toContain("protect_answer_template_version");
    expect(migration).toContain("validate_answer_template_version_review");
    expect(migration).toContain("medical_consultant");
    expect(migration).toContain("super_admin");
    expect(migration).toContain("digest(NEW.answer_text, 'sha256')");
    expect(migration).toContain("validate_deterministic_response_snapshot");
    expect(migration).toContain('AND "active" = true');
    expect(migration).toContain(
      'NEW."answer_snapshot_hash" IS DISTINCT FROM approved."content_hash"',
    );
    expect(migration).toContain("prevent_agronomic_source_mutation");
  });

  it("backfills legacy roles before validating clinical reviewers", () => {
    const migration = readFileSync(
      resolve(
        import.meta.dirname,
        "../drizzle/0003_clinical_review_integrity.sql",
      ),
      "utf8",
    );
    const roleBackfill = migration.indexOf('INSERT INTO "user_roles"');
    const clinicalPreflight = migration.indexOf(
      "Existem templates activos sem revisor",
    );

    expect(roleBackfill).toBeGreaterThanOrEqual(0);
    expect(roleBackfill).toBeLessThan(clinicalPreflight);
  });

  it("confirms clinical role and template-version coherence incrementally", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0006_clinical_confirmation.sql"),
      "utf8",
    );

    expect(migration).toContain(
      "'agricultural_doctor', 'medical_consultant', 'admin', 'super_admin'",
    );
    expect(migration).toContain(
      "IF TG_OP = 'INSERT' OR NEW.\"active\" = true THEN",
    );
    expect(migration).toContain(
      'NEW."answer_template_id" IS DISTINCT FROM approved."answer_template_id"',
    );
  });

  it("migrates legacy roles and refresh families before enforcing constraints", () => {
    const migration = readFileSync(
      resolve(
        import.meta.dirname,
        "../drizzle/0004_identity_refresh_integrity.sql",
      ),
      "utf8",
    );
    const copyLegacyRoles = migration.indexOf('INSERT INTO "user_roles"');
    const dropLegacyRole = migration.indexOf('DROP COLUMN "role"');
    const normalizeFamilies = migration.indexOf("normalized_refresh_families");
    const familyForeignKey = migration.indexOf(
      'ADD CONSTRAINT "refresh_tokens_family_root_fk"',
    );
    const familyUnique = migration.indexOf(
      'CREATE UNIQUE INDEX "refresh_tokens_id_family_id_unique"',
    );
    const parentFamilyForeignKey = migration.indexOf(
      'ADD CONSTRAINT "refresh_tokens_parent_family_fk"',
    );

    expect(copyLegacyRoles).toBeGreaterThanOrEqual(0);
    expect(copyLegacyRoles).toBeLessThan(dropLegacyRole);
    expect(normalizeFamilies).toBeGreaterThanOrEqual(0);
    expect(normalizeFamilies).toBeLessThan(familyForeignKey);
    expect(familyUnique).toBeLessThan(parentFamilyForeignKey);
  });

  it("binds refresh token parents to the same family and user", () => {
    const migration = readFileSync(
      resolve(
        import.meta.dirname,
        "../drizzle/0007_refresh_user_integrity.sql",
      ),
      "utf8",
    );
    const crossUserPreflight = migration.indexOf(
      'child."user_id" IS DISTINCT FROM parent."user_id"',
    );
    const compositeUnique = migration.indexOf(
      'CREATE UNIQUE INDEX "refresh_tokens_id_family_id_user_id_unique"',
    );
    const compositeParentForeignKey = migration.indexOf(
      'ADD CONSTRAINT "refresh_tokens_parent_family_user_fk" FOREIGN KEY ("parent_token_id","family_id","user_id") REFERENCES "public"."refresh_tokens"("id","family_id","user_id")',
    );

    expect(crossUserPreflight).toBeGreaterThanOrEqual(0);
    expect(crossUserPreflight).toBeLessThan(compositeUnique);
    expect(compositeUnique).toBeLessThan(compositeParentForeignKey);
  });

  it("prevents overlapping valid subscriptions for the same user and plan", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0008_subscription_overlap.sql"),
      "utf8",
    );
    const extension = migration.indexOf(
      "CREATE EXTENSION IF NOT EXISTS btree_gist",
    );
    const preflight = migration.indexOf(
      'current_subscription."id" < candidate."id"',
    );
    const exclusion = migration.indexOf(
      'ADD CONSTRAINT "subscriptions_no_active_plan_overlap" EXCLUDE USING gist',
    );

    expect(extension).toBeGreaterThanOrEqual(0);
    expect(preflight).toBeGreaterThan(extension);
    expect(migration).toContain(
      'tstzrange(current_subscription."starts_at", current_subscription."expires_at", \'[)\') &&',
    );
    expect(migration).toContain("WHERE (\"status\" IN ('active', 'trial'))");
    expect(exclusion).toBeGreaterThan(preflight);
  });

  it("migrates seed inventories and immutable tombstones without deletion", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0009_seed_tombstones.sql"),
      "utf8",
    );
    const runner = readFileSync(
      resolve(
        import.meta.dirname,
        "../../../apps/api/src/database/run-seed.ts",
      ),
      "utf8",
    );

    expect(migration).toContain(
      "ADD COLUMN \"entity_ids\" jsonb DEFAULT '{}'::jsonb NOT NULL",
    );
    expect(migration).toContain('CREATE TABLE "seed_tombstones"');
    expect(migration).toContain('"removed_in_version" integer NOT NULL');
    expect(migration).toContain(
      "CREATE TRIGGER seed_tombstone_immutable_guard",
    );
    const versionedTombstoneMigration = readFileSync(
      resolve(
        import.meta.dirname,
        "../drizzle/0011_seed_tombstone_version.sql",
      ),
      "utf8",
    );
    expect(versionedTombstoneMigration).toContain(
      'CREATE UNIQUE INDEX "seed_tombstones_entity_version_unique" ON "seed_tombstones" USING btree ("seed_key","entity_type","entity_id","removed_in_version")',
    );
    expect(runner).toContain("reconcileSeedTombstones");
    expect(runner).not.toContain(".delete(");
    const tombstoneInsert = runner.slice(
      runner.indexOf(".insert(seedTombstones)"),
      runner.indexOf(".insert(seedManifests)"),
    );
    expect(tombstoneInsert).not.toContain("onConflictDoNothing");
  });

  it("drops the unused legacy user role enum incrementally", () => {
    const migration = readFileSync(
      resolve(
        import.meta.dirname,
        "../drizzle/0010_drop_legacy_user_role_enum.sql",
      ),
      "utf8",
    );

    expect(migration).toContain('DROP TYPE IF EXISTS "public"."user_role"');
  });

  it("migrates versioned seed manifests", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0005_seed_manifests.sql"),
      "utf8",
    );

    expect(migration).toContain('CREATE TABLE "seed_manifests"');
    expect(migration).toContain('"key" text PRIMARY KEY NOT NULL');
    expect(migration).toContain('"version" integer NOT NULL');
    expect(migration).toContain('"content_hash" text NOT NULL');
  });
});
