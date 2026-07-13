import { Inject, Injectable } from "@nestjs/common";
import {
  hasEntitlement,
  PAID_FEATURES,
  type EntitlementSnapshot,
  type PaidFeature,
} from "@ndjar/domain";

import { EntitlementsRepository } from "./entitlements.repository.js";

function isPaidFeature(featureKey: string): featureKey is PaidFeature {
  return Object.values(PAID_FEATURES).some(
    (paidFeature) => paidFeature === featureKey,
  );
}

@Injectable()
export class EntitlementsService {
  constructor(
    @Inject(EntitlementsRepository)
    private readonly repository: EntitlementsRepository,
  ) {}

  async getCurrentUserEntitlements(userId: string, now = new Date()) {
    const { entitlements, subscription } =
      await this.repository.findForUser(userId);
    const validEntitlements: EntitlementSnapshot[] = entitlements.flatMap(
      (entitlement) => {
        if (!isPaidFeature(entitlement.featureKey)) {
          return [];
        }

        if (
          !["trial", "active"].includes(entitlement.subscriptionStatus) ||
          entitlement.subscriptionStartsAt > now ||
          entitlement.subscriptionExpiresAt <= now
        ) {
          return [];
        }

        return [
          {
            active: entitlement.active,
            expiresAt: entitlement.expiresAt,
            featureKey: entitlement.featureKey,
          },
        ];
      },
    );

    return {
      features: {
        agriculturalDoctor: hasEntitlement(
          validEntitlements,
          PAID_FEATURES.agriculturalDoctor,
          now,
        ),
        cropDetails: hasEntitlement(
          validEntitlements,
          PAID_FEATURES.cropDetails,
          now,
        ),
        forum: hasEntitlement(validEntitlements, PAID_FEATURES.forum, now),
        map: hasEntitlement(validEntitlements, PAID_FEATURES.map, now),
      },
      subscription: subscription
        ? {
            expiresAt: subscription.expiresAt?.toISOString() ?? null,
            status: subscription.status,
          }
        : null,
    };
  }
}
