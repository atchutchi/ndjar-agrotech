import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthGuard } from "./auth.guard.js";
import { AuthRepository } from "./auth.repository.js";
import { signAccessToken } from "./auth.tokens.js";
import { ROLES_KEY, Roles, RolesGuard } from "./roles.guard.js";

describe("AuthGuard", () => {
  const repository = {
    findById: vi.fn(),
  };

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = randomBytes(48).toString("base64url");
    repository.findById.mockReset();
    repository.findById.mockResolvedValue({
      displayName: "Binta Cisse",
      id: "user-1",
      roles: ["farmer"],
    });
  });

  function createGuard() {
    return new AuthGuard(repository as unknown as AuthRepository);
  }

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
      createGuard().canActivate(requestContext(request)),
    ).resolves.toBe(true);
    expect(request.user).toEqual({ id: "user-1", roles: ["farmer"] });
  });

  it("rejeita pedidos sem Bearer JWT", async () => {
    await expect(
      createGuard().canActivate(requestContext({ headers: {} })),
    ).rejects.toThrow(new UnauthorizedException("Sessão obrigatória"));
  });

  it("rejeita Bearer JWT invalido", async () => {
    await expect(
      createGuard().canActivate(
        requestContext({ headers: { authorization: "Bearer token-invalido" } }),
      ),
    ).rejects.toThrow(new UnauthorizedException("Sessão obrigatória"));
  });

  it("rejeita imediatamente um JWT de uma conta entretanto desactivada", async () => {
    repository.findById.mockResolvedValue(null);
    const token = await signAccessToken({ roles: ["farmer"], sub: "user-1" });

    await expect(
      createGuard().canActivate(
        requestContext({
          headers: { authorization: `Bearer ${token}` },
        }),
      ),
    ).rejects.toThrow(new UnauthorizedException("Sessão obrigatória"));
  });

  it("preserva 503 quando a base de dados esta indisponivel", async () => {
    repository.findById.mockRejectedValue(
      new ServiceUnavailableException("Base de dados indisponivel"),
    );
    const token = await signAccessToken({ roles: ["farmer"], sub: "user-1" });

    await expect(
      createGuard().canActivate(
        requestContext({
          headers: { authorization: `Bearer ${token}` },
        }),
      ),
    ).rejects.toThrow(
      new ServiceUnavailableException("Base de dados indisponivel"),
    );
  });

  it("converte uma falha operacional nao tipificada da base em 503", async () => {
    repository.findById.mockRejectedValue(new Error("connection terminated"));
    const token = await signAccessToken({ roles: ["farmer"], sub: "user-1" });

    await expect(
      createGuard().canActivate(
        requestContext({ headers: { authorization: `Bearer ${token}` } }),
      ),
    ).rejects.toEqual(expect.objectContaining({ status: 503 }));
  });

  it("usa os papeis actuais da base de dados e nao os papeis antigos do JWT", async () => {
    repository.findById.mockResolvedValue({
      displayName: "Admin",
      id: "user-1",
      roles: ["super_admin"],
    });
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

    await createGuard().canActivate(requestContext(request));

    expect(request.user).toEqual({ id: "user-1", roles: ["super_admin"] });
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

  it("prioriza os papeis definidos no handler sobre os da classe", () => {
    class ProtectedController {
      dashboard() {}
    }

    const handler = ProtectedController.prototype.dashboard;
    const descriptor = Object.getOwnPropertyDescriptor(
      ProtectedController.prototype,
      "dashboard",
    );
    if (!descriptor) {
      throw new Error("Missing dashboard descriptor");
    }

    Roles("admin")(ProtectedController);
    Roles("technician")(ProtectedController.prototype, "dashboard", descriptor);

    expect(
      new RolesGuard(new Reflector()).canActivate(
        requestContext(
          { headers: {}, user: { roles: ["technician"] } },
          ProtectedController,
          handler,
        ),
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

function requestContext(
  request: {
    headers: Record<string, string>;
    user?: unknown;
  },
  controller?: object,
  handler?: object,
) {
  return {
    getClass: () => controller,
    getHandler: () => handler,
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
