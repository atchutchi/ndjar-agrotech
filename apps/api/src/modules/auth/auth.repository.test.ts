import { hash } from "argon2";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AuthRepository,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  parseRefreshToken,
} from "./auth.repository.js";

function selectChain<T>(
  result: T,
  onWhere?: (value: unknown) => T | undefined,
  onInnerJoin?: (table: unknown, condition: unknown) => void,
) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn((table: unknown, condition: unknown) => {
      onInnerJoin?.(table, condition);
      return chain;
    }),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn((value: unknown) => {
      return Promise.resolve(onWhere?.(value) ?? result);
    }),
  };

  return chain;
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

const validRefreshTokenSelector = "01234567-89ab-4cde-8f01-23456789abcd";
const validRefreshTokenSecret = "A".repeat(64);
const validRefreshToken = `${validRefreshTokenSelector}.${validRefreshTokenSecret}`;

describe("AuthRepository refresh tokens", () => {
  it("extrai apenas selector UUID canonico e segredo base64url no formato emitido", () => {
    expect(parseRefreshToken(validRefreshToken)).toEqual({
      secret: validRefreshTokenSecret,
      selector: validRefreshTokenSelector,
    });
    expect(parseRefreshToken("sem-separador")).toBeNull();
    expect(parseRefreshToken(`${validRefreshTokenSelector}.`)).toBeNull();
    expect(parseRefreshToken(`.${validRefreshTokenSecret}`)).toBeNull();
  });

  it("rejeita selector que nao seja UUID canonico", () => {
    expect(
      parseRefreshToken(`not-a-uuid.${validRefreshTokenSecret}`),
    ).toBeNull();
    expect(
      parseRefreshToken(
        `01234567-89AB-4CDE-8F01-23456789ABCD.${validRefreshTokenSecret}`,
      ),
    ).toBeNull();
    expect(
      parseRefreshToken(
        `0123456789ab4cde8f0123456789abcd.${validRefreshTokenSecret}`,
      ),
    ).toBeNull();
  });

  it("rejeita segredo que nao seja base64url com o comprimento emitido", () => {
    expect(
      parseRefreshToken(`${validRefreshTokenSelector}.${"A".repeat(63)}`),
    ).toBeNull();
    expect(
      parseRefreshToken(`${validRefreshTokenSelector}.${"A".repeat(65)}`),
    ).toBeNull();
    expect(
      parseRefreshToken(`${validRefreshTokenSelector}.${"A".repeat(63)}+`),
    ).toBeNull();
  });

  it("rejeita tokens com pontos adicionais", () => {
    expect(parseRefreshToken(`${validRefreshToken}.extra`)).toBeNull();
  });

  it("nao inicia transaccao ao rodar ou revogar token invalido", async () => {
    const database = {
      transaction: vi.fn(),
    };
    const repository = new AuthRepository(database as never);

    await expect(
      repository.rotateRefreshToken(`not-a-uuid.${validRefreshTokenSecret}`),
    ).resolves.toBeNull();
    await expect(
      repository.revokeRefreshToken(`not-a-uuid.${validRefreshTokenSecret}`),
    ).resolves.toBeUndefined();

    expect(database.transaction).not.toHaveBeenCalled();
  });

  it("rejeita replay quando a reclamacao atomica ja nao devolve linha", async () => {
    const select = selectChain([
      {
        defaultRole: "farmer",
        displayName: "Binta Cisse",
        id: "user-1",
        passwordHash: "password-hash",
        refreshTokenHash: await hash(validRefreshTokenSecret),
        refreshTokenId: validRefreshTokenSelector,
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

    const result =
      await repositoryWithTransaction(tx).rotateRefreshToken(validRefreshToken);

    expect(result).toBeNull();
    expect(update.where).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("nao renova a sessao de uma conta password desactivada", async () => {
    const disabledAccountRow = [
      {
        defaultRole: "farmer",
        displayName: "Binta Cisse",
        id: "user-1",
        passwordHash: "password-hash",
        refreshTokenHash: await hash(validRefreshTokenSecret),
        refreshTokenId: validRefreshTokenSelector,
        roleId: "farmer",
      },
    ];
    let excludesDisabledPasswordAccount = false;
    const select = selectChain(
      disabledAccountRow,
      () => (excludesDisabledPasswordAccount ? [] : disabledAccountRow),
      (_table, condition) => {
        const query = new PgDialect().sqlToQuery(condition as never).sql;

        excludesDisabledPasswordAccount ||=
          query.includes('"auth_accounts"."disabled_at" is null') &&
          query.includes('"auth_accounts"."provider" = $');
      },
    );
    const update = mutationChain([{ id: validRefreshTokenSelector }]);
    const insert = mutationChain([]);
    const tx = {
      insert: vi.fn(() => insert),
      select: vi.fn(() => select),
      update: vi.fn(() => update),
    };

    const result =
      await repositoryWithTransaction(tx).rotateRefreshToken(validRefreshToken);

    expect(result).toBeNull();
    expect(update.where).not.toHaveBeenCalled();
    expect(insert.values).not.toHaveBeenCalled();
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
