import {
  pilotCalendarTasks,
  pilotCrops,
  pilotSouthRegions,
  type PilotCalendarTask,
  type PilotCommunity,
  type PilotCrop,
  type PilotRegion,
} from "@ndjar/fixtures";

type DraftKey = "doctor-question" | "forum-post";

export interface PilotSnapshot {
  region: PilotRegion;
  communities: PilotCommunity[];
  crops: PilotCrop[];
  calendarTasks: PilotCalendarTask[];
  phExample: PilotRegion["phSamples"][number];
  syncedAt: string;
  source: "fixture-fallback";
}

export interface OfflineStore {
  loadSnapshot: () => Promise<PilotSnapshot>;
  saveDraft: (key: DraftKey, value: string) => Promise<void>;
  getDraft: (key: DraftKey) => Promise<string>;
}

function buildFixtureSnapshot(): PilotSnapshot {
  const region = pilotSouthRegions[0];
  const phExample = region.phSamples[0];

  return {
    region,
    communities: region.communities,
    crops: pilotCrops,
    calendarTasks: pilotCalendarTasks,
    phExample,
    syncedAt: "offline-fixture",
    source: "fixture-fallback",
  };
}

export function createOfflineStore(): OfflineStore {
  const drafts = new Map<DraftKey, string>();
  const snapshot = buildFixtureSnapshot();

  return {
    async loadSnapshot() {
      return snapshot;
    },
    async saveDraft(key, value) {
      drafts.set(key, value);
    },
    async getDraft(key) {
      return drafts.get(key) ?? "";
    },
  };
}

export const offlineStore = createOfflineStore();
