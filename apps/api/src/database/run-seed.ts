import {
  agronomicSources,
  calendarTasks,
  communities,
  communityGroupMembers,
  communityGroups,
  cropAgronomicNotes,
  cropPresence,
  cropPresenceGroupObservations,
  cropProductionEvidence,
  crops,
  regions,
  seedManifests,
  seedTombstones,
  soilSamples,
} from "@ndjar/database";
import * as databaseSchema from "@ndjar/database";
import { pilotSeedData, pilotSeedManifest } from "@ndjar/database/seed";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { pathToFileURL } from "node:url";
import postgres from "postgres";

import type { Database } from "../modules/database/database.module.js";

interface SeedManifest {
  contentHash: string;
  entityIds: SeedEntityInventory;
  key: string;
  tombstones: readonly SeedTombstoneDeclaration[];
  version: number;
}

interface PersistedSeedManifest {
  contentHash: string;
  entityIds: SeedEntityInventory;
  version: number;
}

type SeedEntityInventory = Record<string, string[]>;

interface SeedTombstoneDeclaration {
  entityId: string;
  entityType: string;
}

type AgronomicSourceRecord = (typeof pilotSeedData.agronomicSources)[number];

export function planSeedApplication(
  existing: PersistedSeedManifest | null,
  incoming: SeedManifest,
): "apply" | "backfill" | "skip" {
  if (!existing) {
    return "apply";
  }

  if (existing.version < incoming.version) {
    if (Object.keys(existing.entityIds).length === 0) {
      throw new Error(
        "O inventario do seed persistido esta vazio. Reaplique primeiro a versao actual para efectuar o backfill.",
      );
    }
    return "apply";
  }

  if (existing.version > incoming.version) {
    throw new Error(
      `A versao do seed ${incoming.version} e inferior a versao persistida ${existing.version}.`,
    );
  }

  if (existing.contentHash !== incoming.contentHash) {
    throw new Error(
      "O conteudo do seed diverge para a mesma versao. Incremente a versao e as fontes imutaveis.",
    );
  }

  if (Object.keys(existing.entityIds).length === 0) {
    return "backfill";
  }

  if (
    normalizeSeedInventory(existing.entityIds) !==
    normalizeSeedInventory(incoming.entityIds)
  ) {
    throw new Error(
      "O inventario do seed diverge para a mesma versao e hash de conteudo.",
    );
  }

  return "skip";
}

function normalizeSeedInventory(inventory: SeedEntityInventory): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.keys(inventory)
        .sort()
        .map((entityType) => [
          entityType,
          [...(inventory[entityType] ?? [])].sort(),
        ]),
    ),
  );
}

function tombstoneKey(tombstone: SeedTombstoneDeclaration): string {
  return `${tombstone.entityType}\u0000${tombstone.entityId}`;
}

export function reconcileSeedTombstones(
  previous: SeedEntityInventory,
  current: SeedEntityInventory,
  declared: readonly SeedTombstoneDeclaration[],
): SeedTombstoneDeclaration[] {
  const removed: SeedTombstoneDeclaration[] = [];

  for (const [entityType, previousIds] of Object.entries(previous)) {
    const currentIds = new Set(current[entityType] ?? []);
    for (const entityId of previousIds) {
      if (!currentIds.has(entityId)) {
        removed.push({ entityId, entityType });
      }
    }
  }

  const removedKeys = new Set(removed.map(tombstoneKey));
  const declaredKeys = new Set(declared.map(tombstoneKey));

  if (declaredKeys.size !== declared.length) {
    throw new Error("O manifesto contem tombstones duplicados.");
  }

  const undeclared = removed.find(
    (tombstone) => !declaredKeys.has(tombstoneKey(tombstone)),
  );
  if (undeclared) {
    throw new Error(
      `A remocao ${undeclared.entityType}/${undeclared.entityId} exige um tombstone explicito no manifesto.`,
    );
  }

  const unrelated = declared.find(
    (tombstone) => !removedKeys.has(tombstoneKey(tombstone)),
  );
  if (unrelated) {
    throw new Error(
      `O tombstone ${unrelated.entityType}/${unrelated.entityId} nao corresponde a uma remocao desta versao.`,
    );
  }

  return [...declared].sort((left, right) =>
    tombstoneKey(left).localeCompare(tombstoneKey(right)),
  );
}

export function verifyAgronomicSources(
  expected: readonly AgronomicSourceRecord[],
  persisted: readonly AgronomicSourceRecord[],
): void {
  const persistedById = new Map(persisted.map((source) => [source.id, source]));

  for (const source of expected) {
    const current = persistedById.get(source.id);
    if (
      !current ||
      current.documentTitle !== source.documentTitle ||
      current.documentDateText !== source.documentDateText ||
      current.responsibleName !== source.responsibleName ||
      current.confidence !== source.confidence ||
      current.version !== source.version
    ) {
      throw new Error(
        `A fonte agronomica imutavel ${source.id} diverge do seed versionado.`,
      );
    }
  }
}

export async function seedPilotDatabase(
  database: Database,
  manifest: SeedManifest = pilotSeedManifest,
): Promise<void> {
  await database.transaction(async (tx) => {
    const [existingManifest] = await tx
      .select({
        contentHash: seedManifests.contentHash,
        entityIds: seedManifests.entityIds,
        version: seedManifests.version,
      })
      .from(seedManifests)
      .for("update")
      .where(eq(seedManifests.key, manifest.key));

    const application = planSeedApplication(existingManifest ?? null, manifest);
    if (application === "skip") {
      return;
    }

    if (application === "backfill") {
      await tx
        .update(seedManifests)
        .set({ entityIds: manifest.entityIds, updatedAt: new Date() })
        .where(eq(seedManifests.key, manifest.key));
      return;
    }

    const tombstones = reconcileSeedTombstones(
      existingManifest?.entityIds ?? {},
      manifest.entityIds,
      manifest.tombstones,
    );

    await tx
      .insert(agronomicSources)
      .values(pilotSeedData.agronomicSources)
      .onConflictDoNothing();

    const persistedSources = await tx
      .select({
        confidence: agronomicSources.confidence,
        documentDateText: agronomicSources.documentDateText,
        documentTitle: agronomicSources.documentTitle,
        id: agronomicSources.id,
        responsibleName: agronomicSources.responsibleName,
        version: agronomicSources.version,
      })
      .from(agronomicSources)
      .where(
        inArray(
          agronomicSources.id,
          pilotSeedData.agronomicSources.map((source) => source.id),
        ),
      );
    verifyAgronomicSources(pilotSeedData.agronomicSources, persistedSources);

    for (const record of pilotSeedData.regions) {
      await tx
        .insert(regions)
        .values(record)
        .onConflictDoUpdate({ target: regions.id, set: record });
    }
    for (const record of pilotSeedData.communityGroups) {
      await tx
        .insert(communityGroups)
        .values(record)
        .onConflictDoUpdate({ target: communityGroups.id, set: record });
    }
    for (const record of pilotSeedData.communities) {
      await tx
        .insert(communities)
        .values(record)
        .onConflictDoUpdate({ target: communities.id, set: record });
    }
    for (const record of pilotSeedData.communityGroupMembers) {
      await tx
        .insert(communityGroupMembers)
        .values(record)
        .onConflictDoUpdate({ target: communityGroupMembers.id, set: record });
    }
    for (const record of pilotSeedData.crops) {
      await tx
        .insert(crops)
        .values(record)
        .onConflictDoUpdate({ target: crops.id, set: record });
    }
    for (const record of pilotSeedData.cropPresenceGroupObservations) {
      await tx
        .insert(cropPresenceGroupObservations)
        .values(record)
        .onConflictDoUpdate({
          target: cropPresenceGroupObservations.id,
          set: record,
        });
    }
    for (const record of pilotSeedData.cropPresence) {
      await tx
        .insert(cropPresence)
        .values(record)
        .onConflictDoUpdate({ target: cropPresence.id, set: record });
    }
    for (const record of pilotSeedData.cropProductionEvidence) {
      await tx
        .insert(cropProductionEvidence)
        .values(record)
        .onConflictDoUpdate({ target: cropProductionEvidence.id, set: record });
    }
    for (const record of pilotSeedData.cropAgronomicNotes) {
      await tx
        .insert(cropAgronomicNotes)
        .values(record)
        .onConflictDoUpdate({ target: cropAgronomicNotes.id, set: record });
    }
    for (const record of pilotSeedData.soilSamples) {
      await tx
        .insert(soilSamples)
        .values(record)
        .onConflictDoUpdate({ target: soilSamples.id, set: record });
    }
    for (const record of pilotSeedData.calendarTasks) {
      await tx
        .insert(calendarTasks)
        .values(record)
        .onConflictDoUpdate({ target: calendarTasks.id, set: record });
    }

    if (tombstones.length > 0) {
      await tx.insert(seedTombstones).values(
        tombstones.map((tombstone) => ({
          ...tombstone,
          removedInVersion: manifest.version,
          seedKey: manifest.key,
        })),
      );
    }

    await tx
      .insert(seedManifests)
      .values({
        appliedAt: new Date(),
        contentHash: manifest.contentHash,
        entityIds: manifest.entityIds,
        key: manifest.key,
        version: manifest.version,
      })
      .onConflictDoUpdate({
        target: seedManifests.key,
        set: {
          appliedAt: new Date(),
          contentHash: manifest.contentHash,
          entityIds: manifest.entityIds,
          version: manifest.version,
        },
      });
  });
}

async function runFromEnvironment(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const client = postgres(databaseUrl, { max: 1 });
  try {
    await seedPilotDatabase(drizzle(client, { schema: databaseSchema }));
  } finally {
    await client.end();
  }
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await runFromEnvironment();
}
