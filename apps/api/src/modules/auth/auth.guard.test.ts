import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { AuthGuard } from "./auth.guard.js";
import { signAccessToken } from "./auth.tokens.js";
import { ROLES_KEY, Roles, RolesGuard } from "./roles.guard.js";

describe("AuthGuard", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = randomBytes(48).toString("base64url");
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

describe("RolesGuard", () => {
  it("permite o pedido quando a rota nao exige papeis", () => {
    const reflector = reflectorWithRequiredRoles(undefined);

    expect(
      new RolesGuard(reflector).canActivate(requestContext({ headers: {} })),
    ).toBe(true);
  });

  it("permite o pedido quando o utilizador tem um dos papeis exigidos", () => {
    const reflector = reflectorWithRequiredRoles(["admin", "technician"]);

    expect(
      new RolesGuard(reflector).canActivate(
        requestContext({
          headers: {},
          user: { roles: ["farmer", "technician"] },
        }),
      ),
    ).toBe(true);
  });

  it("rejeita o pedido quando o utilizador nao tem um papel exigido", () => {
    const reflector = reflectorWithRequiredRoles(["admin"]);

    expect(() =>
      new RolesGuard(reflector).canActivate(
        requestContext({ headers: {}, user: { roles: ["farmer"] } }),
      ),
    ).toThrow(new ForbiddenException("Permissão insuficiente"));
  });

  it("rejeita o pedido protegido sem utilizador autenticado", () => {
    const reflector = reflectorWithRequiredRoles(["admin"]);

    expect(() =>
      new RolesGuard(reflector).canActivate(requestContext({ headers: {} })),
    ).toThrow(new ForbiddenException("Permissão insuficiente"));
  });

  it("guarda os papeis exigidos como metadata", () => {
    class ProtectedController {}

    Roles("admin", "technician")(ProtectedController);

    expect(Reflect.getMetadata(ROLES_KEY, ProtectedController)).toEqual([
      "admin",
      "technician",
    ]);
  });
});

function requestContext(request: {
  headers: Record<string, string>;
  user?: unknown;
}) {
  return {
    getClass: () => undefined,
    getHandler: () => undefined,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as never;
}

function reflectorWithRequiredRoles(requiredRoles: string[] | undefined) {
  return {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
}
