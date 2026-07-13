import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { entitlements, subscriptions } from "@ndjar/database";
import { and, desc, eq, gt, inArray, lte } from "drizzle-orm";

import { DATABASE } from "../database/database.module.js";

import type { Database } from "../database/database.module.js";

export interface EntitlementRecord {
  active: boolean;
  expiresAt: Date | null;
  featureKey: string;
  subscriptionExpiresAt: Date;
  subscriptionStartsAt: Date;
  subscriptionStatus: string;
}

export interface SubscriptionRecord {
  expiresAt: Date | null;
  status: string;
}

@Injectable()
export class EntitlementsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database | null) {}

  async findForUser(
    userId: string,
    now = new Date(),
  ): Promise<{
    entitlements: EntitlementRecord[];
    subscription: SubscriptionRecord | null;
  }> {
    const database = this.requireDatabase();
    const [subscription] = await database
      .select({
        expiresAt: subscriptions.expiresAt,
        id: subscriptions.id,
        startsAt: subscriptions.startsAt,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ["active", "trial"]),
          lte(subscriptions.startsAt, now),
          gt(subscriptions.expiresAt, now),
        ),
      )
      .orderBy(
        desc(subscriptions.startsAt),
        desc(subscriptions.createdAt),
        desc(subscriptions.id),
      )
      .limit(1);

    if (!subscription) {
      return {
        entitlements: [],
        subscription: null,
      };
    }

    const rows = await database
      .select({
        active: entitlements.active,
        expiresAt: entitlements.expiresAt,
        featureKey: entitlements.featureKey,
      })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.subscriptionId, subscription.id),
        ),
      );

    const entitlementRows: EntitlementRecord[] = rows.map((row) => ({
      ...row,
      subscriptionExpiresAt: subscription.expiresAt,
      subscriptionStartsAt: subscription.startsAt,
      subscriptionStatus: subscription.status,
    }));

    return {
      entitlements: entitlementRows,
      subscription: {
        expiresAt: subscription.expiresAt,
        status: subscription.status,
      },
    };
  }

  private requireDatabase(): Database {
    if (!this.database) {
      throw new ServiceUnavailableException(
        "EntitlementsRepository requer uma base de dados real. O modo fixture não permite consultar entitlements.",
      );
    }

    return this.database;
  }
}
