import { getTableName } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

import { seedPilotDatabase } from "./run-seed.js";

describe("seedPilotDatabase", () => {
  it("inserts pilot data transactionally in foreign-key order", async () => {
    const insertedTables: string[] = [];
    const transaction = vi.fn(async (callback: (tx: unknown) => unknown) =>
      callback({
        insert: (table: Parameters<typeof getTableName>[0]) => ({
          values: () => ({
            onConflictDoNothing: async () => {
              insertedTables.push(getTableName(table));
            },
          }),
        }),
      }),
    );

    await seedPilotDatabase({ transaction } as never);

    expect(transaction).toHaveBeenCalledOnce();
    expect(insertedTables).toEqual([
      "agronomic_sources",
      "regions",
      "community_groups",
      "communities",
      "community_group_members",
      "crops",
      "crop_presence_group_observations",
      "crop_presence",
      "crop_production_evidence",
      "crop_agronomic_notes",
      "soil_samples",
      "calendar_tasks",
    ]);
  });
});
