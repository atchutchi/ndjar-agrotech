import { hash } from "argon2";
import { PgDialect } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceUnavailableException } from "@nestjs/common";

import {
  AuthRepository,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  buildRefreshTokenLockQuery,
  parseRefreshToken,
} from "./auth.repository.js";

function selectChain<T>(
  result: T,
  onWhere?: (value: unknown) => T | undefined,
  onInnerJoin?: (table: unknown, condition: unknown) => void,
) {
  const chain = {
    for: vi.fn().mockReturnThis(),
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
const validRefreshTokenSecret = randomBytes(48).toString("base64url");
const validRefreshToken = `${validRefreshTokenSelector}.${validRefreshTokenSecret}`;

function testHash(value: string) {
  return hash(value, { memoryCost: 8, parallelism: 1, timeCost: 1 });
}

describe("AuthRepository refresh tokens", () => {
  it("cria a raiz da familia com o mesmo identificador do token", async () => {
    const values = vi.fn().mockResolvedValue([]);
    const repository = new AuthRepository({
      insert: vi.fn().mockReturnValue({ values }),
    } as never);

    const token = await repository.createRefreshToken(
      "22222222-2222-4222-8222-222222222222",
    );
    const parsed = parseRefreshToken(token);

    expect(parsed).not.toBeNull();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: parsed?.selector,
        id: parsed?.selector,
      }),
    );
  });

  it("bloqueia apenas refresh_tokens antes de consultar a identidade", () => {
    const database = drizzle({} as never);
    const query = buildRefreshTokenLockQuery(
      database as never,
      validRefreshTokenSelector,
      new Date("2026-07-13T12:00:00Z"),
    ).toSQL();

    expect(query.sql).toContain('from "refresh_tokens"');
    expect(query.sql).not.toContain(" join ");
    expect(query.sql).toMatch(/ for update$/);
  });

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
        passwordHash: await testHash(randomBytes(32).toString("base64url")),
        refreshTokenHash: await testHash(validRefreshTokenSecret),
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
    expect(select.for).toHaveBeenCalledWith("update");
    expect(update.where).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("nao renova a sessao de uma conta password desactivada", async () => {
    const disabledAccountRow = [
      {
        defaultRole: "farmer",
        displayName: "Binta Cisse",
        id: "user-1",
        passwordHash: await testHash(randomBytes(32).toString("base64url")),
        refreshTokenHash: await testHash(validRefreshTokenSecret),
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

  it("revoga toda a familia quando um token consumido e reutilizado", async () => {
    const familyId = "11111111-1111-4111-8111-111111111111";
    const select = selectChain([
      {
        consumedAt: new Date("2026-07-13T12:00:00Z"),
        displayName: "Binta Cisse",
        familyId,
        id: "user-1",
        passwordHash: await testHash(randomBytes(32).toString("base64url")),
        refreshTokenHash: await testHash(validRefreshTokenSecret),
        refreshTokenId: validRefreshTokenSelector,
        revokedAt: new Date("2026-07-13T12:00:00Z"),
        roleId: "farmer",
        verifiedAt: new Date("2026-07-13T10:00:00Z"),
      },
    ]);
    const revokeFamily = mutationChain([{ id: validRefreshTokenSelector }]);
    const tx = {
      insert: vi.fn(),
      select: vi.fn(() => select),
      update: vi.fn(() => revokeFamily),
    };

    await expect(
      repositoryWithTransaction(tx).rotateRefreshToken(validRefreshToken),
    ).resolves.toBeNull();

    expect(revokeFamily.set).toHaveBeenCalledWith({
      revokedAt: expect.any(Date),
    });
    expect(tx.insert).not.toHaveBeenCalled();
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
        codeHash: await testHash("123456"),
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
    const execute = vi.fn().mockResolvedValue([]);
    const repository = new AuthRepository({
      transaction: (callback: (value: unknown) => unknown) =>
        callback({
          execute,
          insert: vi.fn(() => insert),
          update: vi.fn(() => update),
        }),
    } as never);
    vi.spyOn(repository, "findByIdentifierHash").mockResolvedValue({
      displayName: "Binta Cisse",
      id: "user-1",
      passwordHash: await testHash(randomBytes(32).toString("base64url")),
      roles: ["farmer"],
      verifiedAt: new Date(),
    });

    await repository.createPasswordResetCode({
      codeHash: "code-hash",
      identifierHash: "identifier-hash",
    });

    expect(update.set).toHaveBeenCalledWith({
      consumedAt: expect.any(Date),
    });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.invocationCallOrder[0]).toBeLessThan(
      update.set.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
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
        codeHash: await testHash("123456"),
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
        passwordHash: await testHash(randomBytes(32).toString("base64url")),
      }),
    ).resolves.toBe(true);

    expect(tx.update).toHaveBeenCalledTimes(3);
    expect(updateChains).toHaveLength(0);
  });

  it("incrementa tentativas quando o codigo de reset e invalido", async () => {
    const select = selectChain([
      {
        attempts: 0,
        codeHash: await testHash("123456"),
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
        passwordHash: await testHash(randomBytes(32).toString("base64url")),
      }),
    ).resolves.toBe(false);

    expect(tx.update).toHaveBeenCalledTimes(1);
    expect(update.set).toHaveBeenCalledWith({
      attempts: expect.anything(),
    });
  });
});

describe("AuthRepository fixture mode", () => {
  it("devolve 503 claro quando a operacao exige PostgreSQL", async () => {
    const repository = new AuthRepository(null);

    const error = await repository.findById("user-1").catch((caught) => caught);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getStatus()).toBe(503);
  });
});
