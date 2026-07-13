import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";

import { AuthGuard } from "./auth.guard.js";
import { signAccessToken } from "./auth.tokens.js";

describe("AuthGuard", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test-access-secret";
  });

  it("preenche o utilizador a partir de um Bearer JWT valido", async () => {
    const request: {
      headers: { authorization: string };
      user?: { id: string; roles: string[] };
    } = {
      headers: {
        authorization: `Bearer ${await signAccessToken({
          roles: ["farmer"],
          sub: "user-1",
        })}`,
      },
    };

    await expect(
      new AuthGuard().canActivate(requestContext(request)),
    ).resolves.toBe(true);
    expect(request.user).toEqual({ id: "user-1", roles: ["farmer"] });
  });

  it("rejeita pedidos sem Bearer JWT", async () => {
    await expect(
      new AuthGuard().canActivate(requestContext({ headers: {} })),
    ).rejects.toThrow(new UnauthorizedException("Sessão obrigatória"));
  });

  it("rejeita Bearer JWT invalido", async () => {
    await expect(
      new AuthGuard().canActivate(
        requestContext({ headers: { authorization: "Bearer token-invalido" } }),
      ),
    ).rejects.toThrow(new UnauthorizedException("Sessão obrigatória"));
  });
});

function requestContext(request: {
  headers: Record<string, string>;
  user?: unknown;
}) {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}
