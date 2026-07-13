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
  key: string;
  version: number;
}

interface PersistedSeedManifest {
  contentHash: string;
  version: number;
}

type AgronomicSourceRecord = (typeof pilotSeedData.agronomicSources)[number];

export function planSeedApplication(
  existing: PersistedSeedManifest | null,
  incoming: SeedManifest,
): "apply" | "skip" {
  if (!existing || existing.version < incoming.version) {
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

  return "skip";
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
        version: seedManifests.version,
      })
      .from(seedManifests)
      .for("update")
      .where(eq(seedManifests.key, manifest.key));

    if (planSeedApplication(existingManifest ?? null, manifest) === "skip") {
      return;
    }

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

    await tx
      .insert(seedManifests)
      .values({
        ...manifest,
        appliedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: seedManifests.key,
        set: {
          appliedAt: new Date(),
          contentHash: manifest.contentHash,
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
