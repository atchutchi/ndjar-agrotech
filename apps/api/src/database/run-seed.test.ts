import { describe, expect, it, vi } from "vitest";

import {
  planSeedApplication,
  reconcileSeedTombstones,
  retireSeedEntities,
  seedPilotDatabase,
  verifyAgronomicSources,
} from "./run-seed.js";

describe("planSeedApplication", () => {
  const incoming = {
    contentHash: "b".repeat(64),
    entityIds: { crops: ["arroz", "mandioca"] },
    key: "pilot-south",
    tombstones: [],
    version: 2,
  };

  it("aplica uma versao nova e ignora apenas repeticao identica", () => {
    expect(planSeedApplication(null, incoming)).toBe("apply");
    expect(
      planSeedApplication(
        {
          contentHash: "a".repeat(64),
          entityIds: { crops: ["arroz"] },
          version: 1,
        },
        incoming,
      ),
    ).toBe("apply");
    expect(
      planSeedApplication(
        {
          contentHash: incoming.contentHash,
          entityIds: incoming.entityIds,
          version: incoming.version,
        },
        incoming,
      ),
    ).toBe("skip");
  });

  it("rejeita alteracao silenciosa e downgrade", () => {
    expect(() =>
      planSeedApplication(
        {
          contentHash: "a".repeat(64),
          entityIds: incoming.entityIds,
          version: incoming.version,
        },
        incoming,
      ),
    ).toThrow("mesma versao");
    expect(() =>
      planSeedApplication(
        {
          contentHash: "c".repeat(64),
          entityIds: incoming.entityIds,
          version: incoming.version + 1,
        },
        incoming,
      ),
    ).toThrow("inferior");
  });

  it("backfills a legacy manifest before applying later versions", () => {
    expect(
      planSeedApplication(
        {
          contentHash: incoming.contentHash,
          entityIds: {},
          version: incoming.version,
        },
        incoming,
      ),
    ).toBe("backfill");

    expect(() =>
      planSeedApplication(
        { contentHash: "a".repeat(64), entityIds: {}, version: 1 },
        incoming,
      ),
    ).toThrow("inventario");
  });
});

describe("reconcileSeedTombstones", () => {
  const previous = { crops: ["arroz", "mandioca"], regions: ["sul"] };
  const current = { crops: ["arroz"], regions: ["sul"] };

  it("accepts only removals declared explicitly in the incoming manifest", () => {
    expect(
      reconcileSeedTombstones(previous, current, [
        { entityId: "mandioca", entityType: "crops" },
      ]),
    ).toEqual([{ entityId: "mandioca", entityType: "crops" }]);
  });

  it("rejects undeclared removals and unrelated tombstones", () => {
    expect(() => reconcileSeedTombstones(previous, current, [])).toThrow(
      "tombstone explicito",
    );
    expect(() =>
      reconcileSeedTombstones(previous, previous, [
        { entityId: "mandioca", entityType: "crops" },
      ]),
    ).toThrow("nao corresponde");
  });
});

describe("retireSeedEntities", () => {
  it("retires baseline data in dependency order and keeps an audit tombstone", async () => {
    const operational = new Map([
      [
        "communities",
        new Map([["sare-donha-1", { active: true, referenced: true }]]),
      ],
      ["crops", new Map([["mandioca", { active: true, referenced: false }]])],
    ]);
    const audit: Array<{
      entityId: string;
      entityType: string;
      removedInVersion: number;
      seedKey: string;
    }> = [];
    const retirementOrder: string[] = [];

    await retireSeedEntities(
      [
        { entityId: "sare-donha-1", entityType: "communities" },
        { entityId: "mandioca", entityType: "crops" },
      ],
      { key: "pilot-south", version: 2 },
      {
        retireEntities: async (entityType, entityIds) => {
          retirementOrder.push(entityType);
          const records = operational.get(entityType);
          for (const entityId of entityIds) {
            const record = records?.get(entityId);
            if (record) {
              record.active = false;
            }
          }
          return entityIds;
        },
        recordTombstones: async (records) => {
          audit.push(...records);
        },
      },
    );

    expect(retirementOrder).toEqual(["communities", "crops"]);
    expect(operational.get("crops")?.get("mandioca")).toEqual({
      active: false,
      referenced: false,
    });
    expect(operational.get("communities")?.get("sare-donha-1")).toEqual({
      active: false,
      referenced: true,
    });
    expect(audit).toContainEqual({
      entityId: "mandioca",
      entityType: "crops",
      removedInVersion: 2,
      seedKey: "pilot-south",
    });
  });

  it("rejects non-operational and user-owned entity types", async () => {
    const retireEntities = vi.fn();

    await expect(
      retireSeedEntities(
        [{ entityId: "source-v1", entityType: "agronomicSources" }],
        { key: "pilot-south", version: 2 },
        { retireEntities, recordTombstones: vi.fn() },
      ),
    ).rejects.toThrow("nao pode ser retirado");
    await expect(
      retireSeedEntities(
        [{ entityId: "user-1", entityType: "users" }],
        { key: "pilot-south", version: 2 },
        { retireEntities, recordTombstones: vi.fn() },
      ),
    ).rejects.toThrow("nao pode ser retirado");
    expect(retireEntities).not.toHaveBeenCalled();
  });
});

describe("verifyAgronomicSources", () => {
  const source = {
    confidence: "medium",
    documentDateText: "2026",
    documentTitle: "Diagnostico",
    id: "diagnostico-v1",
    responsibleName: "N'djar",
    version: 1,
  } as const;

  it("aceita a mesma versao imutavel e rejeita divergencias", () => {
    expect(() => verifyAgronomicSources([source], [source])).not.toThrow();
    expect(() =>
      verifyAgronomicSources([source], [{ ...source, documentTitle: "Outro" }]),
    ).toThrow("diverge");
  });
});

describe("seedPilotDatabase", () => {
  it("nao escreve quando o manifesto persistido e identico", async () => {
    const insert = vi.fn();
    const transaction = vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback({
        insert,
        select: () => ({
          from: () => ({
            for: () => ({
              where: async () => [
                {
                  contentHash:
                    "replace-with-current-manifest-through-mock-hook",
                  entityIds: { crops: ["arroz"] },
                  version: 1,
                },
              ],
            }),
          }),
        }),
      }),
    );

    await seedPilotDatabase({ transaction } as never, {
      contentHash: "replace-with-current-manifest-through-mock-hook",
      entityIds: { crops: ["arroz"] },
      key: "pilot-south",
      tombstones: [],
      version: 1,
    });

    expect(transaction).toHaveBeenCalledOnce();
    expect(insert).not.toHaveBeenCalled();
  });
});
