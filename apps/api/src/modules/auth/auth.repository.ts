import { Inject, Injectable } from "@nestjs/common";
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
import { and, eq, gt, isNull } from "drizzle-orm";
import { hash, verify } from "argon2";
import { randomBytes } from "node:crypto";

import { DATABASE } from "../database/database.module.js";

import type { Database } from "../database/database.module.js";

export interface AuthUserRecord {
  displayName: string | null;
  id: string;
  passwordHash: string;
  roles: string[];
}

export interface AuthSessionRecord {
  refreshToken: string;
  user: AuthUserRecord;
}

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
];

function newRefreshToken() {
  return randomBytes(48).toString("base64url");
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
        defaultRole: users.role,
        displayName: users.displayName,
        id: users.id,
        passwordHash: authAccounts.passwordHash,
        roleId: roles.id,
      })
      .from(authAccounts)
      .innerJoin(users, eq(authAccounts.userId, users.id))
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(authAccounts.provider, "password"),
          eq(authAccounts.loginIdentifierHash, identifierHash),
          isNull(authAccounts.disabledAt),
          eq(users.isActive, true),
        ),
      );

    return this.toAuthUserRecord(rows);
  }

  async findById(
    userId: string,
  ): Promise<Omit<AuthUserRecord, "passwordHash"> | null> {
    const rows = await this.requireDatabase()
      .select({
        defaultRole: users.role,
        displayName: users.displayName,
        id: users.id,
        passwordHash: authAccounts.passwordHash,
        roleId: roles.id,
      })
      .from(users)
      .leftJoin(authAccounts, eq(authAccounts.userId, users.id))
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, userRoles.roleId))
      .where(and(eq(users.id, userId), eq(users.isActive, true)));

    const user = this.toAuthUserRecord(rows);
    if (!user) {
      return null;
    }

    return {
      displayName: user.displayName,
      id: user.id,
      roles: user.roles,
    };
  }

  async createRefreshToken(userId: string): Promise<string> {
    const token = newRefreshToken();

    await this.requireDatabase()
      .insert(refreshTokens)
      .values({
        userId,
        tokenHash: await hash(token),
        expiresAt: expiresInDays(30),
      });

    return token;
  }

  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<AuthSessionRecord | null> {
    const database = this.requireDatabase();

    return database.transaction(async (tx) => {
      const rows = await tx
        .select({
          defaultRole: users.role,
          displayName: users.displayName,
          id: users.id,
          passwordHash: authAccounts.passwordHash,
          refreshTokenHash: refreshTokens.tokenHash,
          refreshTokenId: refreshTokens.id,
          roleId: roles.id,
        })
        .from(refreshTokens)
        .innerJoin(users, eq(refreshTokens.userId, users.id))
        .leftJoin(authAccounts, eq(authAccounts.userId, users.id))
        .leftJoin(userRoles, eq(userRoles.userId, users.id))
        .leftJoin(roles, eq(roles.id, userRoles.roleId))
        .where(
          and(
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, new Date()),
            eq(users.isActive, true),
          ),
        );

      const matchingRows = await this.findRowsForRefreshToken(
        rows,
        refreshToken,
      );
      const user = this.toAuthUserRecord(matchingRows);
      const tokenId = matchingRows[0]?.refreshTokenId;
      if (!user || !tokenId) {
        return null;
      }

      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, tokenId));

      const nextRefreshToken = newRefreshToken();
      await tx.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: await hash(nextRefreshToken),
        expiresAt: expiresInDays(30),
      });

      return {
        refreshToken: nextRefreshToken,
        user,
      };
    });
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const database = this.requireDatabase();

    await database.transaction(async (tx) => {
      const rows = await tx
        .select({
          refreshTokenHash: refreshTokens.tokenHash,
          refreshTokenId: refreshTokens.id,
        })
        .from(refreshTokens)
        .where(
          and(
            isNull(refreshTokens.revokedAt),
            gt(refreshTokens.expiresAt, new Date()),
          ),
        );

      for (const row of rows) {
        if (await verify(row.refreshTokenHash, refreshToken)) {
          await tx
            .update(refreshTokens)
            .set({ revokedAt: new Date() })
            .where(eq(refreshTokens.id, row.refreshTokenId));
          return;
        }
      }
    });
  }

  async consumeAccountVerification(input: {
    userId: string;
    code: string;
  }): Promise<boolean> {
    const database = this.requireDatabase();

    return database.transaction(async (tx) => {
      const rows = await tx
        .select({
          codeHash: verificationCodes.codeHash,
          id: verificationCodes.id,
        })
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, input.userId),
            eq(verificationCodes.purpose, "account_verification"),
            isNull(verificationCodes.consumedAt),
            gt(verificationCodes.expiresAt, new Date()),
          ),
        );

      for (const row of rows) {
        if (await verify(row.codeHash, input.code)) {
          await tx
            .update(verificationCodes)
            .set({ consumedAt: new Date() })
            .where(eq(verificationCodes.id, row.id));
          await tx
            .update(userProfiles)
            .set({ verifiedAt: new Date() })
            .where(eq(userProfiles.userId, input.userId));
          return true;
        }
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

    await this.requireDatabase()
      .insert(verificationCodes)
      .values({
        userId: user.id,
        purpose: "password_reset",
        targetHash: input.identifierHash,
        codeHash: input.codeHash,
        expiresAt: expiresInMinutes(15),
      });
  }

  async resetPassword(input: {
    identifierHash: string;
    code: string;
    passwordHash: string;
  }): Promise<boolean> {
    const database = this.requireDatabase();

    return database.transaction(async (tx) => {
      const rows = await tx
        .select({
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
            gt(verificationCodes.expiresAt, new Date()),
          ),
        );

      for (const row of rows) {
        if (!row.userId || !(await verify(row.codeHash, input.code))) {
          continue;
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
          .update(verificationCodes)
          .set({ consumedAt: new Date() })
          .where(eq(verificationCodes.id, row.id));

        return true;
      }

      return false;
    });
  }

  private requireDatabase(): Database {
    if (!this.database) {
      throw new Error(
        "AuthRepository requer uma base de dados real; NDJAR_DATABASE_MODE=fixture devolve null.",
      );
    }

    return this.database;
  }

  private async findRowsForRefreshToken<
    T extends { refreshTokenHash: string; refreshTokenId: string },
  >(rows: T[], refreshToken: string): Promise<T[]> {
    for (const row of rows) {
      if (await verify(row.refreshTokenHash, refreshToken)) {
        return rows.filter(
          (candidate) => candidate.refreshTokenId === row.refreshTokenId,
        );
      }
    }

    return [];
  }

  private toAuthUserRecord(
    rows: {
      defaultRole: string;
      displayName: string | null;
      id: string;
      passwordHash: string | null;
      roleId: string | null;
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
      roles: [
        ...new Set(
          [firstRow.defaultRole, ...rows.map((row) => row.roleId)].filter(
            (role): role is string => Boolean(role),
          ),
        ),
      ],
    };
  }
}
