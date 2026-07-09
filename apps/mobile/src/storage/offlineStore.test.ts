import { describe, expect, it } from "vitest";

import { createOfflineStore } from "./offlineStore";

describe("createOfflineStore", () => {
  it("loads the pilot snapshot from fixtures when no persisted snapshot exists", async () => {
    const store = createOfflineStore();

    const snapshot = await store.loadSnapshot();

    expect(snapshot.region.regionName).toBe("Quinara");
    expect(snapshot.region.sectorName).toBe("Buba");
    expect(snapshot.communities.map((community) => community.name)).toContain(
      "Sare Donha 1",
    );
    expect(snapshot.phExample.status).toBe("example");
  });

  it("persists simple doctor and forum drafts in memory", async () => {
    const store = createOfflineStore();

    await store.saveDraft("doctor-question", "Mandioca com folhas amarelas");
    await store.saveDraft("forum-post", "Quando plantar arroz?");

    await expect(store.getDraft("doctor-question")).resolves.toBe(
      "Mandioca com folhas amarelas",
    );
    await expect(store.getDraft("forum-post")).resolves.toBe(
      "Quando plantar arroz?",
    );
  });
});
