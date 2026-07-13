import { getTableName } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import {
  createVerifiedLocalAdmin,
  readLocalAdminConfig,
} from "./create-local-admin.js";

function validEnvironment() {
  return {
    DATABASE_URL: "postgres://local-database/ndjar",
    NDJAR_ADMIN_IDENTIFIER: `admin-${randomBytes(8).toString("hex")}`,
    NDJAR_ADMIN_NAME: "Administrador Local",
    NDJAR_ADMIN_PASSWORD: randomBytes(24).toString("base64url"),
    NDJAR_ADMIN_ROLE: "admin",
    NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP: "true",
    NODE_ENV: "development",
  };
}

describe("readLocalAdminConfig", () => {
  it("exige todas as variaveis explicitas e recusa producao", () => {
    expect(() => readLocalAdminConfig({})).toThrow();
    expect(() =>
      readLocalAdminConfig({ ...validEnvironment(), NODE_ENV: "production" }),
    ).toThrow("producao");
    expect(() =>
      readLocalAdminConfig({
        ...validEnvironment(),
        NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP: "false",
      }),
    ).toThrow("NDJAR_ALLOW_LOCAL_ADMIN_BOOTSTRAP");
  });

  it("aceita apenas admin ou super_admin e uma password forte", () => {
    expect(() =>
      readLocalAdminConfig({
        ...validEnvironment(),
        NDJAR_ADMIN_ROLE: "farmer",
      }),
    ).toThrow("NDJAR_ADMIN_ROLE");
    expect(() =>
      readLocalAdminConfig({
        ...validEnvironment(),
        NDJAR_ADMIN_PASSWORD: randomBytes(4).toString("hex"),
      }),
    ).toThrow("16 caracteres");

    expect(readLocalAdminConfig(validEnvironment())).toMatchObject({
      displayName: "Administrador Local",
      roleId: "admin",
    });
  });
});

describe("createVerifiedLocalAdmin", () => {
  it("cria perfil verificado e atribui o papel em user_roles", async () => {
    const inserted: { table: string; values: unknown }[] = [];
    const tx = {
      insert: vi.fn((table: Parameters<typeof getTableName>[0]) => ({
        values: (values: unknown) => {
          inserted.push({ table: getTableName(table), values });
          return {
            onConflictDoNothing: vi.fn().mockResolvedValue([]),
            returning: vi
              .fn()
              .mockResolvedValue(
                getTableName(table) === "users" ? [{ id: "user-1" }] : [],
              ),
          };
        },
      })),
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({ limit: vi.fn().mockResolvedValue([]) }),
        }),
      })),
    };
    const database = {
      transaction: (callback: (value: typeof tx) => unknown) => callback(tx),
    };
    const config = readLocalAdminConfig(validEnvironment());

    await expect(
      createVerifiedLocalAdmin(database as never, config),
    ).resolves.toEqual({ userId: "user-1" });
    expect(inserted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "user_profiles",
          values: expect.objectContaining({ verifiedAt: expect.any(Date) }),
        }),
        expect.objectContaining({
          table: "user_roles",
          values: expect.objectContaining({ roleId: "admin" }),
        }),
      ]),
    );
  });
});
