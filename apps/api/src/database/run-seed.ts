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
  soilSamples,
} from "@ndjar/database";
import * as databaseSchema from "@ndjar/database";
import { pilotSeedData } from "@ndjar/database/seed";
import { drizzle } from "drizzle-orm/postgres-js";
import { pathToFileURL } from "node:url";
import postgres from "postgres";

import type { Database } from "../modules/database/database.module.js";

export async function seedPilotDatabase(database: Database): Promise<void> {
  await database.transaction(async (tx) => {
    await tx
      .insert(agronomicSources)
      .values(pilotSeedData.agronomicSources)
      .onConflictDoNothing();
    await tx
      .insert(regions)
      .values(pilotSeedData.regions)
      .onConflictDoNothing();
    await tx
      .insert(communityGroups)
      .values(pilotSeedData.communityGroups)
      .onConflictDoNothing();
    await tx
      .insert(communities)
      .values(pilotSeedData.communities)
      .onConflictDoNothing();
    await tx
      .insert(communityGroupMembers)
      .values(pilotSeedData.communityGroupMembers)
      .onConflictDoNothing();
    await tx.insert(crops).values(pilotSeedData.crops).onConflictDoNothing();
    await tx
      .insert(cropPresenceGroupObservations)
      .values(pilotSeedData.cropPresenceGroupObservations)
      .onConflictDoNothing();
    await tx
      .insert(cropPresence)
      .values(pilotSeedData.cropPresence)
      .onConflictDoNothing();
    await tx
      .insert(cropProductionEvidence)
      .values(pilotSeedData.cropProductionEvidence)
      .onConflictDoNothing();
    await tx
      .insert(cropAgronomicNotes)
      .values(pilotSeedData.cropAgronomicNotes)
      .onConflictDoNothing();
    await tx
      .insert(soilSamples)
      .values(pilotSeedData.soilSamples)
      .onConflictDoNothing();
    await tx
      .insert(calendarTasks)
      .values(pilotSeedData.calendarTasks)
      .onConflictDoNothing();
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
