export const NDJAR_ROLES = {
  farmer: "farmer",
  agriculturalDoctor: "agricultural_doctor",
  medicalConsultant: "medical_consultant",
  admin: "admin",
  superAdmin: "super_admin",
} as const;

export type NdjarRole = (typeof NDJAR_ROLES)[keyof typeof NDJAR_ROLES];

export const PAID_FEATURES = {
  map: "map",
  cropDetails: "crop_details",
  forum: "forum",
  agriculturalDoctor: "agricultural_doctor",
} as const;

export type PaidFeature = (typeof PAID_FEATURES)[keyof typeof PAID_FEATURES];

export interface EntitlementSnapshot {
  active: boolean;
  expiresAt: Date | null;
  featureKey: PaidFeature;
}

export function canAccessAdmin(roleIds: NdjarRole[]) {
  return (
    roleIds.includes(NDJAR_ROLES.admin) ||
    roleIds.includes(NDJAR_ROLES.superAdmin)
  );
}

export function hasEntitlement(
  entitlements: EntitlementSnapshot[],
  featureKey: PaidFeature,
  now = new Date(),
) {
  return entitlements.some((entitlement) => {
    if (!entitlement.active || entitlement.featureKey !== featureKey) {
      return false;
    }

    return !entitlement.expiresAt || entitlement.expiresAt > now;
  });
}
