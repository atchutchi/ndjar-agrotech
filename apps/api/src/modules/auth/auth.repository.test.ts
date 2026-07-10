import { hash } from "argon2";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AuthRepository,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  parseRefreshToken,
} from "./auth.repository.js";

function selectChain<T>(result: T, onWhere?: (value: unknown) => void) {
  return {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn((value: unknown) => {
      onWhere?.(value);
      return Promise.resolve(result);
    }),
  };
}

function mutationChain<T>(result: T, onWhere?: (value: unknown) => void) {
  return {
    returning: vi.fn().mockResolvedValue(result),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(result),
    where: vi.fn((value: unknown) => {
      onWhere?.(value);
      return {
        returning: vi.fn().mockResolvedValue(result),
      };
    }),
  };
}

function repositoryWithTransaction(tx: unknown) {
  return new AuthRepository({
    transaction: (callback: (value: unknown) => unknown) => callback(tx),
  } as never);
}

describe("AuthRepository refresh tokens", () => {
  it("extrai selector publico e segredo sem aceitar formatos ambiguos", () => {
    expect(parseRefreshToken("selector.secret-value")).toEqual({
      secret: "secret-value",
      selector: "selector",
    });
    expect(parseRefreshToken("sem-separador")).toBeNull();
    expect(parseRefreshToken("selector.")).toBeNull();
    expect(parseRefreshToken(".secret")).toBeNull();
  });

  it("rejeita replay quando a reclamacao atomica ja nao devolve linha", async () => {
    const select = selectChain([
      {
        defaultRole: "farmer",
        displayName: "Binta Cisse",
        id: "user-1",
        passwordHash: "password-hash",
        refreshTokenHash: await hash("secret-value"),
        refreshTokenId: "selector",
        roleId: "farmer",
      },
    ]);
    const update = mutationChain([]);
    const insert = vi.fn();
    const tx = {
      insert,
      select: vi.fn(() => select),
      update: vi.fn(() => update),
    };

    const result = await repositoryWithTransaction(tx).rotateRefreshToken(
      "selector.secret-value",
    );

    expect(result).toBeNull();
    expect(update.where).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("AuthRepository verification codes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expoe um limite pequeno e explicito de tentativas", () => {
    expect(VERIFICATION_CODE_MAX_ATTEMPTS).toBeGreaterThan(0);
    expect(VERIFICATION_CODE_MAX_ATTEMPTS).toBeLessThanOrEqual(5);
  });

  it("incrementa tentativas quando o codigo de verificacao e invalido", async () => {
    const select = selectChain([
      {
        attempts: 0,
        codeHash: await hash("123456"),
        id: "code-1",
      },
    ]);
    const update = mutationChain([{ id: "code-1" }]);
    const tx = {
      select: vi.fn(() => select),
      update: vi.fn(() => update),
    };

    await expect(
      repositoryWithTransaction(tx).consumeAccountVerification({
        code: "000000",
        userId: "user-1",
      }),
    ).resolves.toBe(false);

    expect(tx.update).toHaveBeenCalled();
    expect(update.set).toHaveBeenCalledWith({
      attempts: expect.anything(),
    });
  });

  it("invalida resets anteriores antes de emitir novo codigo", async () => {
    const update = mutationChain([{ id: "old-code" }]);
    const insert = mutationChain([]);
    const repository = new AuthRepository({
      transaction: (callback: (value: unknown) => unknown) =>
        callback({
          insert: vi.fn(() => insert),
          update: vi.fn(() => update),
        }),
    } as never);
    vi.spyOn(repository, "findByIdentifierHash").mockResolvedValue({
      displayName: "Binta Cisse",
      id: "user-1",
      passwordHash: "password-hash",
      roles: ["farmer"],
    });

    await repository.createPasswordResetCode({
      codeHash: "code-hash",
      identifierHash: "identifier-hash",
    });

    expect(update.set).toHaveBeenCalledWith({
      consumedAt: expect.any(Date),
    });
    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: "password_reset",
      }),
    );
  });

  it("revoga refresh tokens activos na mesma transaccao do reset", async () => {
    const select = selectChain([
      {
        attempts: 0,
        codeHash: await hash("123456"),
        id: "code-1",
        userId: "user-1",
      },
    ]);
    const updateChains = [
      mutationChain([{ id: "code-1" }]),
      mutationChain([{ id: "account-1" }]),
      mutationChain([{ id: "refresh-1" }]),
    ];
    const tx = {
      select: vi.fn(() => select),
      update: vi.fn(() => updateChains.shift()),
    };

    await expect(
      repositoryWithTransaction(tx).resetPassword({
        code: "123456",
        identifierHash: "identifier-hash",
        passwordHash: "new-password-hash",
      }),
    ).resolves.toBe(true);

    expect(tx.update).toHaveBeenCalledTimes(3);
    expect(updateChains).toHaveLength(0);
  });

  it("incrementa tentativas quando o codigo de reset e invalido", async () => {
    const select = selectChain([
      {
        attempts: 0,
        codeHash: await hash("123456"),
        id: "code-1",
        userId: "user-1",
      },
    ]);
    const update = mutationChain([{ id: "code-1" }]);
    const tx = {
      select: vi.fn(() => select),
      update: vi.fn(() => update),
    };

    await expect(
      repositoryWithTransaction(tx).resetPassword({
        code: "000000",
        identifierHash: "identifier-hash",
        passwordHash: "new-password-hash",
      }),
    ).resolves.toBe(false);

    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(update.set).toHaveBeenCalledWith({
      attempts: expect.anything(),
    });
  });
});
