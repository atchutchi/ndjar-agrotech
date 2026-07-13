import { Test } from "@nestjs/testing";
import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthController } from "./auth.controller.js";
import { AuthGuard } from "./auth.guard.js";
import {
  AuthRateLimitGuard,
  AuthRateLimitStore,
} from "./auth-rate-limit.guard.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";

const authService = {
  forgotPassword: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
  refresh: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  verify: vi.fn(),
};

const testPassword = randomBytes(32).toString("base64url");
const testNewPassword = randomBytes(32).toString("base64url");
const invalidPassword = randomBytes(4).toString("hex");
const testAccessToken = randomBytes(32).toString("base64url");
const testRefreshToken = randomBytes(32).toString("base64url");
const testRenewedAccessToken = randomBytes(32).toString("base64url");
const testRenewedRefreshToken = randomBytes(32).toString("base64url");

async function createController() {
  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: AuthGuard, useValue: { canActivate: () => true } },
      { provide: AuthRepository, useValue: { findById: vi.fn() } },
      AuthRateLimitGuard,
      AuthRateLimitStore,
    ],
  }).compile();

  return module.get(AuthController);
}

describe("AuthController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    "register",
    "verify",
    "login",
    "refresh",
    "forgotPassword",
    "resetPassword",
    "logout",
  ] as const)("limita pedidos em %s", (method) => {
    expect(
      Reflect.getMetadata("__guards__", AuthController.prototype[method]),
    ).toContain(AuthRateLimitGuard);
  });

  it("regista uma conta de agricultor", async () => {
    authService.register.mockResolvedValue({
      userId: "user-1",
      verificationRequired: true,
    });

    const controller = await createController();

    await expect(
      controller.register({
        displayName: "Binta Cisse",
        password: testPassword,
        phone: "+245956086144",
      }),
    ).resolves.toEqual({
      userId: "user-1",
      verificationRequired: true,
    });
    expect(authService.register).toHaveBeenCalledWith({
      displayName: "Binta Cisse",
      password: testPassword,
      phone: "+245956086144",
    });
  });

  it("valida o registo antes de delegar", async () => {
    const controller = await createController();

    expect(() =>
      controller.register({
        displayName: "B",
        password: invalidPassword,
        phone: "1",
      }),
    ).toThrow();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("verifica uma conta", async () => {
    authService.verify.mockResolvedValue({ verified: true });
    const controller = await createController();

    await expect(
      controller.verify({
        code: "123456",
        userId: "6b07d760-4b8a-4f4b-b037-c1a8fe6e8b84",
      }),
    ).resolves.toEqual({ verified: true });
    expect(authService.verify).toHaveBeenCalledWith({
      code: "123456",
      userId: "6b07d760-4b8a-4f4b-b037-c1a8fe6e8b84",
    });
  });

  it("valida a verificacao antes de delegar", async () => {
    const controller = await createController();

    expect(() => controller.verify({ code: "1", userId: "user-1" })).toThrow();
    expect(authService.verify).not.toHaveBeenCalled();
  });

  it("inicia sessao", async () => {
    authService.login.mockResolvedValue({
      accessToken: testAccessToken,
      refreshToken: testRefreshToken,
      user: {
        displayName: "Binta Cisse",
        id: "user-1",
        roles: ["farmer"],
      },
    });
    const controller = await createController();

    await expect(
      controller.login({
        identifier: "+245956086144",
        password: testPassword,
      }),
    ).resolves.toMatchObject({
      accessToken: testAccessToken,
      refreshToken: testRefreshToken,
      user: {
        id: "user-1",
        roles: ["farmer"],
      },
    });
    expect(authService.login).toHaveBeenCalledWith({
      identifier: "+245956086144",
      password: testPassword,
    });
  });

  it("valida o login antes de delegar", async () => {
    const controller = await createController();

    expect(() =>
      controller.login({ identifier: "ab", password: invalidPassword }),
    ).toThrow();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("renova uma sessao", async () => {
    authService.refresh.mockResolvedValue({
      accessToken: testRenewedAccessToken,
      refreshToken: testRenewedRefreshToken,
      user: {
        displayName: "Binta Cisse",
        id: "user-1",
        roles: ["farmer"],
      },
    });
    const controller = await createController();

    await expect(
      controller.refresh({
        refreshToken: testRefreshToken,
      }),
    ).resolves.toMatchObject({
      accessToken: testRenewedAccessToken,
      refreshToken: testRenewedRefreshToken,
    });
    expect(authService.refresh).toHaveBeenCalledWith({
      refreshToken: testRefreshToken,
    });
  });

  it("valida a renovacao antes de delegar", async () => {
    const controller = await createController();

    expect(() => controller.refresh({ refreshToken: "short" })).toThrow();
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it("inicia recuperacao de password", async () => {
    authService.forgotPassword.mockResolvedValue({ resetRequired: true });
    const controller = await createController();

    await expect(
      controller.forgotPassword({ identifier: "+245956086144" }),
    ).resolves.toEqual({ resetRequired: true });
    expect(authService.forgotPassword).toHaveBeenCalledWith({
      identifier: "+245956086144",
    });
  });

  it("valida a recuperacao de password antes de delegar", async () => {
    const controller = await createController();

    expect(() => controller.forgotPassword({ identifier: "ab" })).toThrow();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it("redefine a password", async () => {
    authService.resetPassword.mockResolvedValue({ passwordReset: true });
    const controller = await createController();

    await expect(
      controller.resetPassword({
        code: "123456",
        identifier: "+245956086144",
        newPassword: testNewPassword,
      }),
    ).resolves.toEqual({ passwordReset: true });
    expect(authService.resetPassword).toHaveBeenCalledWith({
      code: "123456",
      identifier: "+245956086144",
      newPassword: testNewPassword,
    });
  });

  it("valida a redefinicao de password antes de delegar", async () => {
    const controller = await createController();

    expect(() =>
      controller.resetPassword({
        code: "1",
        identifier: "ab",
        newPassword: invalidPassword,
      }),
    ).toThrow();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("devolve a identidade actual", async () => {
    authService.me.mockResolvedValue({
      displayName: "Binta Cisse",
      id: "user-1",
      roles: ["farmer"],
    });
    const controller = await createController();
    const request = { user: { id: "user-1", roles: ["farmer"] } };

    await expect(controller.me(request)).resolves.toEqual({
      displayName: "Binta Cisse",
      id: "user-1",
      roles: ["farmer"],
    });
    expect(authService.me).toHaveBeenCalledWith(request.user);
  });

  it("termina sessao", async () => {
    authService.logout.mockResolvedValue({ loggedOut: true });
    const controller = await createController();

    await expect(
      controller.logout({
        refreshToken: testRefreshToken,
      }),
    ).resolves.toEqual({ loggedOut: true });
    expect(authService.logout).toHaveBeenCalledWith({
      refreshToken: testRefreshToken,
    });
  });

  it("valida o logout antes de delegar", async () => {
    const controller = await createController();

    expect(() => controller.logout({ refreshToken: "short" })).toThrow();
    expect(authService.logout).not.toHaveBeenCalled();
  });
});
