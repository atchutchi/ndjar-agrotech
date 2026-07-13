import {
  authAccounts,
  roles,
  userProfiles,
  userRoles,
  users,
} from "@ndjar/database";
import { hash } from "argon2";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import postgres from "postgres";

import type { Database } from "../modules/database/database.module.js";

type LocalAdminRole = "admin" | "super_admin";

export interface LocalAdminConfig {
  databaseUrl: string;
  displayName: string;
  identifier: string;
  password: string;
  roleId: LocalAdminRole;
}

function required(
  environment: Record<string, string | undefined>,
  name: string,
): string {
  const value = environment[name]?.trim();
  if (!value) {
    throw new Error(`${name} e obrigatoria.`);
  }

  return value;
}

export function readLocalAdminConfig(
  environment: Record<string, string | undefined>,
): LocalAdminConfig {
  if (environment.NODE_ENV === "production") {
    throw new Error(
      "O bootstrap de administrador local e proibido em producao.",
    );
  }
  if (environment.NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP !== "true") {
    throw new Error(
      "NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP tem de ser explicitamente true.",
    );
  }

  const password = required(environment, "NDJAR_ADMIN_PASSWORD");
  if (password.length < 16) {
    throw new Error(
      "NDJAR_ADMIN_PASSWORD tem de possuir pelo menos 16 caracteres.",
    );
  }

  const roleId = required(environment, "NDJAR_ADMIN_ROLE");
  if (roleId !== "admin" && roleId !== "super_admin") {
    throw new Error("NDJAR_ADMIN_ROLE tem de ser admin ou super_admin.");
  }

  return {
    databaseUrl: required(environment, "DATABASE_URL"),
    displayName: required(environment, "NDJAR_ADMIN_NAME"),
    identifier: required(environment, "NDJAR_ADMIN_IDENTIFIER"),
    password,
    roleId,
  };
}

function stableIdentifierHash(identifier: string): string {
  return createHash("sha256")
    .update(identifier.trim().toLowerCase())
    .digest("hex");
}

function roleDefinition(roleId: LocalAdminRole) {
  return roleId === "admin"
    ? {
        description: "Acesso administrativo ao produto NDJAR.",
        id: roleId,
        label: "Administrador",
      }
    : {
        description: "Acesso administrativo total ao produto NDJAR.",
        id: roleId,
        label: "Super Administrador",
      };
}

export async function createVerifiedLocalAdmin(
  database: Database,
  config: LocalAdminConfig,
): Promise<{ userId: string }> {
  const identifierHash = stableIdentifierHash(config.identifier);
  const passwordHash = await hash(config.password);

  return database.transaction(async (tx) => {
    const [existingAccount] = await tx
      .select({ id: authAccounts.id })
      .from(authAccounts)
      .where(
        and(
          eq(authAccounts.provider, "password"),
          eq(authAccounts.loginIdentifierHash, identifierHash),
        ),
      )
      .limit(1);
    if (existingAccount) {
      throw new Error("Ja existe uma conta para NDJAR_ADMIN_IDENTIFIER.");
    }

    await tx
      .insert(roles)
      .values(roleDefinition(config.roleId))
      .onConflictDoNothing();

    const [createdUser] = await tx
      .insert(users)
      .values({
        displayName: config.displayName,
        isActive: true,
        phoneNumberHash: identifierHash,
      })
      .returning({ id: users.id });
    if (!createdUser) {
      throw new Error("Nao foi possivel criar o administrador local.");
    }

    const verifiedAt = new Date();
    await tx.insert(userProfiles).values({
      fullName: config.displayName,
      phoneNumberHash: identifierHash,
      userId: createdUser.id,
      verifiedAt,
    });
    await tx.insert(authAccounts).values({
      loginIdentifierHash: identifierHash,
      passwordHash,
      provider: "password",
      userId: createdUser.id,
    });
    await tx.insert(userRoles).values({
      roleId: config.roleId,
      userId: createdUser.id,
    });

    return { userId: createdUser.id };
  });
}

async function runFromEnvironment(): Promise<void> {
  const config = readLocalAdminConfig(process.env);
  const client = postgres(config.databaseUrl, { max: 1 });
  try {
    const result = await createVerifiedLocalAdmin(drizzle(client), config);
    process.stdout.write(`Administrador local criado: ${result.userId}\n`);
  } finally {
    await client.end();
  }
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await runFromEnvironment();
}
