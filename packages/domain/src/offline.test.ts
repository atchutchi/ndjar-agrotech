import { describe, expect, it } from "vitest";

import { resolveOfflineSyncStrategy } from "./index";

describe("resolveOfflineSyncStrategy", () => {
  it("prefers server data for validated agronomic content", () => {
    expect(
      resolveOfflineSyncStrategy({
        entity: "crop",
        status: "consultant_reviewed",
        hasPendingLocalChanges: true,
      }),
    ).toBe("prefer-server");
  });

  it("prefers local data for unsent drafts", () => {
    expect(
      resolveOfflineSyncStrategy({
        entity: "sample_draft",
        status: "self_reported",
        hasPendingLocalChanges: true,
      }),
    ).toBe("prefer-local");
  });
});
