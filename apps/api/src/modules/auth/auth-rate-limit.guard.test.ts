import { HttpException } from "@nestjs/common";
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

  it("devolve 429 depois do limite da operacao por IP", () => {
    const guard = new AuthRateLimitGuard(
      reflector as never,
      new AuthRateLimitStore(),
    );

    expect(guard.canActivate(context("192.0.2.10"))).toBe(true);
    expect(guard.canActivate(context("192.0.2.10"))).toBe(true);
    try {
      guard.canActivate(context("192.0.2.10"));
      throw new Error("O terceiro pedido devia ser limitado");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
    }
  });

  it("isola contadores por IP e por operacao", () => {
    const guard = new AuthRateLimitGuard(
      reflector as never,
      new AuthRateLimitStore(),
    );

    guard.canActivate(context("192.0.2.10", "login"));
    guard.canActivate(context("192.0.2.10", "login"));

    expect(guard.canActivate(context("192.0.2.11", "login"))).toBe(true);
    expect(guard.canActivate(context("192.0.2.10", "register"))).toBe(true);
  });
});
