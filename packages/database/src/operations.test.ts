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
});
