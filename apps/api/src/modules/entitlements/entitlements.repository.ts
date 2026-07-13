import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { entitlements, subscriptions } from "@ndjar/database";
import { and, desc, eq } from "drizzle-orm";

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

  async findForUser(userId: string): Promise<{
    entitlements: EntitlementRecord[];
    subscription: SubscriptionRecord | null;
  }> {
    const database = this.requireDatabase();
    const [entitlementRows, subscriptionRows] = await Promise.all([
      database
        .select({
          active: entitlements.active,
          expiresAt: entitlements.expiresAt,
          featureKey: entitlements.featureKey,
          subscriptionExpiresAt: subscriptions.expiresAt,
          subscriptionStartsAt: subscriptions.startsAt,
          subscriptionStatus: subscriptions.status,
        })
        .from(entitlements)
        .innerJoin(
          subscriptions,
          and(
            eq(entitlements.subscriptionId, subscriptions.id),
            eq(entitlements.userId, subscriptions.userId),
          ),
        )
        .where(eq(entitlements.userId, userId)),
      database
        .select({
          expiresAt: subscriptions.expiresAt,
          status: subscriptions.status,
        })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(
          desc(subscriptions.startsAt),
          desc(subscriptions.createdAt),
          desc(subscriptions.id),
        )
        .limit(1),
    ]);

    return {
      entitlements: entitlementRows,
      subscription: subscriptionRows[0] ?? null,
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
