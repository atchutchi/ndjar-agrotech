import { describe, expect, it } from "vitest";

import { canAccessAdmin, hasEntitlement, PAID_FEATURES } from "./auth.js";

describe("auth domain rules", () => {
  it("allows only admin and super admin into admin surfaces", () => {
    expect(canAccessAdmin(["farmer"])).toBe(false);
    expect(canAccessAdmin(["agricultural_doctor"])).toBe(false);
    expect(canAccessAdmin(["admin"])).toBe(true);
    expect(canAccessAdmin(["super_admin"])).toBe(true);
  });

  it("requires active unexpired entitlement for paid features", () => {
    expect(
      hasEntitlement(
        [
          {
            active: true,
            expiresAt: new Date("2026-08-01T00:00:00Z"),
            featureKey: PAID_FEATURES.map,
          },
        ],
        PAID_FEATURES.map,
        new Date("2026-07-10T00:00:00Z"),
      ),
    ).toBe(true);
  });
});
