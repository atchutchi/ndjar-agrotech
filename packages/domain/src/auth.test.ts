import { describe, expect, it } from "vitest";

import {
  canAccessAdmin,
  hasEntitlement,
  PAID_FEATURES,
  type EntitlementSnapshot,
  type NdjarRole,
  type PaidFeature,
} from "./auth.js";

type IsExact<Type, Expected> = [Type] extends [Expected]
  ? [Expected] extends [Type]
    ? true
    : false
  : false;

type Assert<Type extends true> = Type;

type _EntitlementFeatureKeyIsPaidFeature = Assert<
  IsExact<EntitlementSnapshot["featureKey"], PaidFeature>
>;
type _AdminRolesAreNdjarRoles = Assert<
  IsExact<Parameters<typeof canAccessAdmin>[0], NdjarRole[]>
>;

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

  it("rejects inactive, expired and different-feature entitlements", () => {
    const now = new Date("2026-07-10T00:00:00Z");

    expect(
      hasEntitlement(
        [
          {
            active: false,
            expiresAt: new Date("2026-08-01T00:00:00Z"),
            featureKey: PAID_FEATURES.map,
          },
        ],
        PAID_FEATURES.map,
        now,
      ),
    ).toBe(false);

    expect(
      hasEntitlement(
        [
          {
            active: true,
            expiresAt: new Date("2026-07-10T00:00:00Z"),
            featureKey: PAID_FEATURES.map,
          },
        ],
        PAID_FEATURES.map,
        now,
      ),
    ).toBe(false);

    expect(
      hasEntitlement(
        [
          {
            active: true,
            expiresAt: new Date("2026-08-01T00:00:00Z"),
            featureKey: PAID_FEATURES.forum,
          },
        ],
        PAID_FEATURES.map,
        now,
      ),
    ).toBe(false);
  });

  it("allows an active entitlement without an expiration date", () => {
    expect(
      hasEntitlement(
        [
          {
            active: true,
            expiresAt: null,
            featureKey: PAID_FEATURES.map,
          },
        ],
        PAID_FEATURES.map,
        new Date("2026-07-10T00:00:00Z"),
      ),
    ).toBe(true);
  });
});
