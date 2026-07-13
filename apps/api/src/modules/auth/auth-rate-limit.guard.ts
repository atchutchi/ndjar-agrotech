import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { sql } from "drizzle-orm";

import { DATABASE } from "../database/database.module.js";

import type { Database } from "../database/database.module.js";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export const AUTH_RATE_LIMIT_KEY = "ndjar:auth-rate-limit";

export const AuthRateLimit = (config: RateLimitConfig) =>
  SetMetadata(AUTH_RATE_LIMIT_KEY, config);

@Injectable()
export class AuthRateLimitStore {
  constructor(@Inject(DATABASE) private readonly database: Database | null) {}

  async consume(key: string, config: RateLimitConfig, now = Date.now()) {
    const database = this.requireDatabase();
    const windowStartedAt = new Date(now);
    const expiresAt = new Date(now + config.windowMs);
    const cleanupBefore = new Date(now - 60 * 60 * 1000);
    const result = await database.execute(sql`
      WITH cleaned AS (
        DELETE FROM auth_rate_limits
        WHERE expires_at <= ${cleanupBefore}
      ), consumed AS (
        INSERT INTO auth_rate_limits (
          key,
          request_count,
          window_started_at,
          expires_at,
          created_at,
          updated_at
        ) VALUES (
          ${key},
          1,
          ${windowStartedAt},
          ${expiresAt},
          ${windowStartedAt},
          ${windowStartedAt}
        )
        ON CONFLICT (key) DO UPDATE SET
          request_count = CASE
            WHEN auth_rate_limits.expires_at <= EXCLUDED.window_started_at THEN 1
            ELSE auth_rate_limits.request_count + 1
          END,
          window_started_at = CASE
            WHEN auth_rate_limits.expires_at <= EXCLUDED.window_started_at
              THEN EXCLUDED.window_started_at
            ELSE auth_rate_limits.window_started_at
          END,
          expires_at = CASE
            WHEN auth_rate_limits.expires_at <= EXCLUDED.window_started_at
              THEN EXCLUDED.expires_at
            ELSE auth_rate_limits.expires_at
          END,
          updated_at = EXCLUDED.updated_at
        RETURNING request_count AS "requestCount"
      )
      SELECT "requestCount" FROM consumed
    `);
    const row = (result as unknown as { requestCount?: number }[])[0];

    if (!row || !Number.isInteger(Number(row.requestCount))) {
      throw new ServiceUnavailableException(
        "Nao foi possivel actualizar o limite de autenticacao.",
      );
    }

    return Number(row.requestCount) <= config.limit;
  }

  private requireDatabase(): Database {
    if (!this.database) {
      throw new ServiceUnavailableException(
        "O rate limit de autenticacao requer PostgreSQL.",
      );
    }

    return this.database;
  }
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthRateLimitStore) private readonly store: AuthRateLimitStore,
  ) {}

  async canActivate(context: ExecutionContext) {
    const config = this.reflector.get<RateLimitConfig>(
      AUTH_RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ ip?: string }>();
    const operation = context.getHandler().name || "unknown";
    const key = `${operation}:${request.ip ?? "unknown"}`;
    if (!(await this.store.consume(key, config))) {
      throw new HttpException(
        "Demasiados pedidos. Tente novamente mais tarde.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
