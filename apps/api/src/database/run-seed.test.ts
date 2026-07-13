import { describe, expect, it, vi } from "vitest";

import {
  planSeedApplication,
  reconcileSeedTombstones,
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
