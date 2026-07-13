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

  it("enables PostGIS in the first migration", () => {
    const migration = readFileSync(
      resolve(import.meta.dirname, "../drizzle/0000_initial_schema.sql"),
      "utf8",
    );

    expect(migration).toContain("CREATE EXTENSION IF NOT EXISTS postgis");
    expect(migration.indexOf("CREATE EXTENSION IF NOT EXISTS postgis")).toBeLessThan(
      migration.indexOf("CREATE TABLE"),
    );
  });
});
