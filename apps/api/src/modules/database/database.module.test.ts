import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DATABASE, DatabaseModule } from "./database.module.js";

describe("DatabaseModule", () => {
  let originalDatabaseUrl: string | undefined;
  let originalDatabaseMode: string | undefined;

  beforeEach(() => {
    originalDatabaseUrl = process.env.DATABASE_URL;
    originalDatabaseMode = process.env.NDJAR_DATABASE_MODE;
  });

  afterEach(() => {
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

  it("throws a clear error when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.NDJAR_DATABASE_MODE;

    await expect(
      Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile(),
    ).rejects.toThrow("DATABASE_URL is required");
  });

  it("can be skipped in fixture mode", async () => {
    process.env.NDJAR_DATABASE_MODE = "fixture";
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    expect(module.get(DATABASE)).toBeNull();
  });
});
