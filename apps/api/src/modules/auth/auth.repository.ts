import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  authAccounts,
  refreshTokens,
  roles,
  userProfiles,
  userRoles,
  users,
  verificationCodes,
} from "@ndjar/database";
import { NDJAR_ROLES } from "@ndjar/domain";
import { and, eq, gt, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { hash, verify } from "argon2";
import { randomBytes, randomUUID } from "node:crypto";

import { DATABASE } from "../database/database.module.js";

import type { Database } from "../database/database.module.js";

export interface AuthUserRecord {
  displayName: string | null;
  id: string;
  passwordHash: string;
  roles: string[];
  verifiedAt: Date | null;
}

export interface AuthSessionRecord {
  refreshToken: string;
  user: AuthUserRecord;
}

export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
export const REFRESH_TOKEN_SECRET_LENGTH = 64;

const refreshTokenSelectorPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const refreshTokenSecretPattern = /^[A-Za-z0-9_-]+$/;

const roleSeed = [
  {
    id: NDJAR_ROLES.farmer,
    label: "Agricultor",
    description: "Acesso de agricultor ao produto NDJAR.",
  },
  {
    id: NDJAR_ROLES.agriculturalDoctor,
    label: "Medico Agricola",
    description: "Acesso de medico agricola para resposta a consultas.",
  },
  {
    id: NDJAR_ROLES.admin,
    label: "Administrador",
    description: "Acesso administrativo ao produto NDJAR.",
  },
  {
    id: NDJAR_ROLES.superAdmin,
    label: "Super Administrador",
    description: "Acesso administrativo total ao produto NDJAR.",
  },
];

function newRefreshTokenParts() {
  const selector = randomUUID();
  const secret = randomBytes(48).toString("base64url");

  return {
    secret,
    selector,
    token: `${selector}.${secret}`,
  };
}

export function parseRefreshToken(
  token: string,
): { secret: string; selector: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [selector, secret] = parts;
  if (!selector || !secret) {
    return null;
  }

  if (!refreshTokenSelectorPattern.test(selector)) {
    return null;
  }

  if (
    secret.length !== REFRESH_TOKEN_SECRET_LENGTH ||
    !refreshTokenSecretPattern.test(secret)
  ) {
    return null;
  }

  return {
    secret,
    selector,
  };
}

function expiresInMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function expiresInDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE) private readonly database: Database | null) {}

  async createFarmerAccount(input: {
    displayName: string;
    email?: string;
    identifierHash: string;
    passwordHash: string;
    verificationCodeHash: string;
  }): Promise<{ userId: string }> {
    const database = this.requireDatabase();

    return database.transaction(async (tx) => {
      await tx.insert(roles).values(roleSeed).onConflictDoNothing();

      const [createdUser] = await tx
        .insert(users)
        .values({
          displayName: input.displayName,
          phoneNumberHash: input.identifierHash,
          role: NDJAR_ROLES.farmer,
        })
        .returning({ id: users.id });

      if (!createdUser) {
        throw new Error("Nao foi possivel criar o utilizador.");
      }

      await tx.insert(userProfiles).values({
        email: input.email ?? null,
        userId: createdUser.id,
        fullName: input.displayName,
        phoneNumberHash: input.identifierHash,
      });

      await tx.insert(authAccounts).values({
        userId: createdUser.id,
        provider: "password",
        loginIdentifierHash: input.identifierHash,
        passwordHash: input.passwordHash,
      });

      await tx.insert(userRoles).values({
        userId: createdUser.id,
        roleId: NDJAR_ROLES.farmer,
      });

      await tx.insert(verificationCodes).values({
        userId: createdUser.id,
        purpose: "account_verification",
        targetHash: input.identifierHash,
        codeHash: input.verificationCodeHash,
        expiresAt: expiresInMinutes(15),
      });

      return { userId: createdUser.id };
    });
  }

  async findByIdentifierHash(
    identifierHash: string,
  ): Promise<AuthUserRecord | null> {
    const rows = await this.requireDatabase()
      .select({
        displayName: users.displayName,
        id: users.id,
        passwordHash: authAccounts.passwordHash,
        roleId: roles.id,
        verifiedAt: userProfiles.verifiedAt,
      })
      .from(authAccounts)
      .innerJoin(users, eq(authAccounts.userId, users.id))
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(authAccounts.provider, "password"),
          eq(authAccounts.loginIdentifierHash, identifierHash),
          isNull(authAccounts.disabledAt),
          eq(users.isActive, true),
          isNotNull(userProfiles.verifiedAt),
        ),
      );

    return this.toAuthUserRecord(rows);
  }

  async findById(
    userId: string,
  ): Promise<Omit<AuthUserRecord, "passwordHash"> | null> {
    const rows = await this.requireDatabase()
      .select({
        displayName: users.displayName,
        id: users.id,
        passwordHash: authAccounts.passwordHash,
        roleId: roles.id,
        verifiedAt: userProfiles.verifiedAt,
      })
      .from(users)
      .innerJoin(
        authAccounts,
        and(
          eq(authAccounts.userId, users.id),
          eq(authAccounts.provider, "password"),
          isNull(authAccounts.disabledAt),
        ),
      )
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(users.id, userId),
          eq(users.isActive, true),
          isNotNull(userProfiles.verifiedAt),
        ),
      );

    const user = this.toAuthUserRecord(rows);
    if (!user) {
      return null;
    }

    return {
      displayName: user.displayName,
      id: user.id,
      roles: user.roles,
      verifiedAt: user.verifiedAt,
    };
  }

  async createRefreshToken(userId: string): Promise<string> {
    const token = newRefreshTokenParts();
    const familyId = randomUUID();

    await this.requireDatabase()
      .insert(refreshTokens)
      .values({
        id: token.selector,
        familyId,
        userId,
        tokenHash: await hash(token.secret),
        expiresAt: expiresInDays(30),
      });

    return token.token;
  }

  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<AuthSessionRecord | null> {
    const parsedToken = parseRefreshToken(refreshToken);
    if (!parsedToken) {
      return null;
    }

    const database = this.requireDatabase();
    return database.transaction(async (tx) => {
      const now = new Date();
      const rows = await tx
        .select({
          consumedAt: refreshTokens.consumedAt,
          displayName: users.displayName,
          familyId: refreshTokens.familyId,
          id: users.id,
          passwordHash: authAccounts.passwordHash,
          refreshTokenHash: refreshTokens.tokenHash,
          refreshTokenId: refreshTokens.id,
          revokedAt: refreshTokens.revokedAt,
          roleId: roles.id,
          verifiedAt: userProfiles.verifiedAt,
        })
        .from(refreshTokens)
        .innerJoin(users, eq(refreshTokens.userId, users.id))
        .innerJoin(
          authAccounts,
          and(
            eq(authAccounts.userId, users.id),
            eq(authAccounts.provider, "password"),
            isNull(authAccounts.disabledAt),
          ),
        )
        .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
        .leftJoin(userRoles, eq(userRoles.userId, users.id))
        .leftJoin(roles, eq(roles.id, userRoles.roleId))
        .where(
          and(
            eq(refreshTokens.id, parsedToken.selector),
            gt(refreshTokens.expiresAt, now),
            eq(users.isActive, true),
            isNotNull(userProfiles.verifiedAt),
          ),
        );

      const firstRow = rows[0];
      if (
        !firstRow ||
        !(await verify(firstRow.refreshTokenHash, parsedToken.secret))
      ) {
        return null;
      }

      if (firstRow.consumedAt) {
        await tx
          .update(refreshTokens)
          .set({ revokedAt: now })
          .where(
            and(
              eq(refreshTokens.familyId, firstRow.familyId),
              isNull(refreshTokens.revokedAt),
            ),
          );
        return null;
      }

      if (firstRow.revokedAt) {
        return null;
      }

      const [claimedToken] = await tx
        .update(refreshTokens)
        .set({ consumedAt: now, revokedAt: now })
        .where(
          and(
            eq(refreshTokens.id, parsedToken.selector),
            isNull(refreshTokens.consumedAt),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, now),
          ),
        )
        .returning({ id: refreshTokens.id });

      if (!claimedToken) {
        await tx
          .update(refreshTokens)
          .set({ revokedAt: now })
          .where(
            and(
              eq(refreshTokens.familyId, firstRow.familyId),
              isNull(refreshTokens.revokedAt),
            ),
          );
        return null;
      }

      const user = this.toAuthUserRecord(rows);
      if (!user) {
        return null;
      }

      const nextRefreshToken = newRefreshTokenParts();
      await tx.insert(refreshTokens).values({
        id: nextRefreshToken.selector,
        familyId: firstRow.familyId,
        parentTokenId: firstRow.refreshTokenId,
        userId: user.id,
        tokenHash: await hash(nextRefreshToken.secret),
        expiresAt: expiresInDays(30),
      });

      return {
        refreshToken: nextRefreshToken.token,
        user,
      };
    });
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const parsedToken = parseRefreshToken(refreshToken);
    if (!parsedToken) {
      return;
    }

    const database = this.requireDatabase();
    await database.transaction(async (tx) => {
      const now = new Date();
      const rows = await tx
        .select({
          refreshTokenHash: refreshTokens.tokenHash,
          refreshTokenId: refreshTokens.id,
        })
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.id, parsedToken.selector),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, now),
          ),
        );

      const firstRow = rows[0];
      if (
        !firstRow ||
        !(await verify(firstRow.refreshTokenHash, parsedToken.secret))
      ) {
        return;
      }

      await tx
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(refreshTokens.id, parsedToken.selector),
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, now),
          ),
        );
    });
  }

  async consumeAccountVerification(input: {
    userId: string;
    code: string;
  }): Promise<boolean> {
    const database = this.requireDatabase();

    return database.transaction(async (tx) => {
      const now = new Date();
      const rows = await tx
        .select({
          attempts: verificationCodes.attempts,
          codeHash: verificationCodes.codeHash,
          id: verificationCodes.id,
        })
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, input.userId),
            eq(verificationCodes.purpose, "account_verification"),
            isNull(verificationCodes.consumedAt),
            gt(verificationCodes.expiresAt, now),
            lt(verificationCodes.attempts, VERIFICATION_CODE_MAX_ATTEMPTS),
          ),
        );

      for (const row of rows) {
        if (await verify(row.codeHash, input.code)) {
          const [consumedCode] = await tx
            .update(verificationCodes)
            .set({ consumedAt: now })
            .where(
              and(
                eq(verificationCodes.id, row.id),
                isNull(verificationCodes.consumedAt),
                gt(verificationCodes.expiresAt, now),
                lt(verificationCodes.attempts, VERIFICATION_CODE_MAX_ATTEMPTS),
              ),
            )
            .returning({ id: verificationCodes.id });

          if (!consumedCode) {
            return false;
          }

          await tx
            .update(userProfiles)
            .set({ verifiedAt: now })
            .where(eq(userProfiles.userId, input.userId));
          return true;
        }
      }

      for (const row of rows) {
        await tx
          .update(verificationCodes)
          .set({ attempts: sql`${verificationCodes.attempts} + 1` })
          .where(
            and(
              eq(verificationCodes.id, row.id),
              isNull(verificationCodes.consumedAt),
              gt(verificationCodes.expiresAt, now),
              lt(verificationCodes.attempts, VERIFICATION_CODE_MAX_ATTEMPTS),
            ),
          );
      }

      return false;
    });
  }

  async createPasswordResetCode(input: {
    identifierHash: string;
    codeHash: string;
  }): Promise<void> {
    const user = await this.findByIdentifierHash(input.identifierHash);
    if (!user) {
      return;
    }

    await this.requireDatabase().transaction(async (tx) => {
      const now = new Date();

      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${input.identifierHash}, 0))`,
      );

      await tx
        .update(verificationCodes)
        .set({ consumedAt: now })
        .where(
          and(
            eq(verificationCodes.targetHash, input.identifierHash),
            eq(verificationCodes.purpose, "password_reset"),
            isNull(verificationCodes.consumedAt),
            gt(verificationCodes.expiresAt, now),
          ),
        );

      await tx.insert(verificationCodes).values({
        userId: user.id,
        purpose: "password_reset",
        targetHash: input.identifierHash,
        codeHash: input.codeHash,
        expiresAt: expiresInMinutes(15),
      });
    });
  }

  async resetPassword(input: {
    identifierHash: string;
    code: string;
    passwordHash: string;
  }): Promise<boolean> {
    const database = this.requireDatabase();

    return database.transaction(async (tx) => {
      const now = new Date();
      const rows = await tx
        .select({
          attempts: verificationCodes.attempts,
          codeHash: verificationCodes.codeHash,
          id: verificationCodes.id,
          userId: verificationCodes.userId,
        })
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.targetHash, input.identifierHash),
            eq(verificationCodes.purpose, "password_reset"),
            isNull(verificationCodes.consumedAt),
            gt(verificationCodes.expiresAt, now),
            lt(verificationCodes.attempts, VERIFICATION_CODE_MAX_ATTEMPTS),
          ),
        );

      for (const row of rows) {
        if (!row.userId || !(await verify(row.codeHash, input.code))) {
          continue;
        }

        const [consumedCode] = await tx
          .update(verificationCodes)
          .set({ consumedAt: now })
          .where(
            and(
              eq(verificationCodes.id, row.id),
              isNull(verificationCodes.consumedAt),
              gt(verificationCodes.expiresAt, now),
              lt(verificationCodes.attempts, VERIFICATION_CODE_MAX_ATTEMPTS),
            ),
          )
          .returning({ id: verificationCodes.id });

        if (!consumedCode) {
          return false;
        }

        await tx
          .update(authAccounts)
          .set({ passwordHash: input.passwordHash })
          .where(
            and(
              eq(authAccounts.userId, row.userId),
              eq(authAccounts.provider, "password"),
            ),
          );
        await tx
          .update(refreshTokens)
          .set({ revokedAt: now })
          .where(
            and(
              eq(refreshTokens.userId, row.userId),
              isNull(refreshTokens.revokedAt),
              gt(refreshTokens.expiresAt, now),
            ),
          );

        return true;
      }

      for (const row of rows) {
        await tx
          .update(verificationCodes)
          .set({ attempts: sql`${verificationCodes.attempts} + 1` })
          .where(
            and(
              eq(verificationCodes.id, row.id),
              isNull(verificationCodes.consumedAt),
              gt(verificationCodes.expiresAt, now),
              lt(verificationCodes.attempts, VERIFICATION_CODE_MAX_ATTEMPTS),
            ),
          );
      }

      return false;
    });
  }

  private requireDatabase(): Database {
    if (!this.database) {
      throw new ServiceUnavailableException(
        "AuthRepository requer uma base de dados real; NDJAR_DATABASE_MODE=fixture devolve null.",
      );
    }

    return this.database;
  }

  private toAuthUserRecord(
    rows: {
      displayName: string | null;
      id: string;
      passwordHash: string | null;
      roleId: string | null;
      verifiedAt: Date | null;
    }[],
  ): AuthUserRecord | null {
    const firstRow = rows[0];
    if (!firstRow?.passwordHash) {
      return null;
    }

    return {
      displayName: firstRow.displayName,
      id: firstRow.id,
      passwordHash: firstRow.passwordHash,
      roles: [...new Set(rows.map((row) => row.roleId).filter(Boolean))] as string[],
      verifiedAt: firstRow.verifiedAt,
    };
  }
}
