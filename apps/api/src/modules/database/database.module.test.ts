import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { DATABASE, DatabaseModule } from "./database.module.js";

describe("DatabaseModule", () => {
  it("throws a clear error when DATABASE_URL is missing", async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    const originalDatabaseMode = process.env.NDJAR_DATABASE_MODE;
    delete process.env.DATABASE_URL;
    delete process.env.NDJAR_DATABASE_MODE;

    await expect(
      Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile(),
    ).rejects.toThrow("DATABASE_URL is required");

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    if (originalDatabaseMode === undefined) {
      delete process.env.NDJAR_DATABASE_MODE;
    } else {
      process.env.NDJAR_DATABASE_MODE = originalDatabaseMode;
    }
  });

  it("can be skipped in fixture mode", async () => {
    process.env.NDJAR_DATABASE_MODE = "fixture";
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    expect(module.get(DATABASE)).toBeNull();
    delete process.env.NDJAR_DATABASE_MODE;
  });
});
