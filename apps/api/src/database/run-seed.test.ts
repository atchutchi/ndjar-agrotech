import { describe, expect, it, vi } from "vitest";

import {
  planSeedApplication,
  seedPilotDatabase,
  verifyAgronomicSources,
} from "./run-seed.js";

describe("planSeedApplication", () => {
  const incoming = {
    contentHash: "b".repeat(64),
    key: "pilot-south",
    version: 2,
  };

  it("aplica uma versao nova e ignora apenas repeticao identica", () => {
    expect(planSeedApplication(null, incoming)).toBe("apply");
    expect(
      planSeedApplication(
        { contentHash: "a".repeat(64), version: 1 },
        incoming,
      ),
    ).toBe("apply");
    expect(
      planSeedApplication(
        { contentHash: incoming.contentHash, version: incoming.version },
        incoming,
      ),
    ).toBe("skip");
  });

  it("rejeita alteracao silenciosa e downgrade", () => {
    expect(() =>
      planSeedApplication(
        { contentHash: "a".repeat(64), version: incoming.version },
        incoming,
      ),
    ).toThrow("mesma versao");
    expect(() =>
      planSeedApplication(
        { contentHash: "c".repeat(64), version: incoming.version + 1 },
        incoming,
      ),
    ).toThrow("inferior");
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
      key: "pilot-south",
      version: 1,
    });

    expect(transaction).toHaveBeenCalledOnce();
    expect(insert).not.toHaveBeenCalled();
  });
});
