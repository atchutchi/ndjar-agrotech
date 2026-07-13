import { ServiceUnavailableException } from "@nestjs/common";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AuthRateLimitGuard,
  AuthRateLimitStore,
} from "./auth-rate-limit.guard.js";

function context(ip: string, handlerName = "login") {
  return {
    getHandler: () => ({ name: handlerName }),
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
    }),
  } as never;
}

describe("AuthRateLimitGuard", () => {
  const reflector = {
    get: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reflector.get.mockReturnValue({ limit: 2, windowMs: 60_000 });
  });

  it("devolve 429 depois do limite partilhado da operacao por IP", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce([{ requestCount: 1 }])
      .mockResolvedValueOnce([{ requestCount: 2 }])
      .mockResolvedValueOnce([{ requestCount: 3 }]);
    const guard = new AuthRateLimitGuard(
      reflector as never,
      new AuthRateLimitStore({ execute } as never),
    );

    await expect(guard.canActivate(context("192.0.2.10"))).resolves.toBe(true);
    await expect(guard.canActivate(context("192.0.2.10"))).resolves.toBe(true);
    await expect(guard.canActivate(context("192.0.2.10"))).rejects.toEqual(
      expect.objectContaining({ status: 429 }),
    );
  });

  it("usa um upsert atomico com expiracao e limpeza partilhada", async () => {
    const execute = vi.fn().mockResolvedValue([{ requestCount: 1 }]);
    const store = new AuthRateLimitStore({ execute } as never);

    await expect(
      store.consume(
        "login:192.0.2.10",
        { limit: 2, windowMs: 60_000 },
        Date.parse("2026-07-13T12:00:00.000Z"),
      ),
    ).resolves.toBe(true);

    const query = new PgDialect().sqlToQuery(
      execute.mock.calls[0]?.[0] as never,
    );
    const normalizedSql = query.sql.toLowerCase();
    expect(normalizedSql).toContain("delete from auth_rate_limits");
    expect(normalizedSql).toContain("insert into auth_rate_limits");
    expect(normalizedSql).toContain("on conflict (key) do update");
    expect(normalizedSql).toContain("auth_rate_limits.expires_at <=");
    expect(normalizedSql).toContain("auth_rate_limits.request_count + 1");
    expect(normalizedSql).toContain("returning request_count");
  });

  it("devolve 503 no modo fixture", async () => {
    const store = new AuthRateLimitStore(null);

    await expect(
      store.consume("login:192.0.2.10", { limit: 2, windowMs: 60_000 }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
