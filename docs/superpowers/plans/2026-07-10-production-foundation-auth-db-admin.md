# Production Foundation Auth DB Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production foundation for N'djar: authentication, roles, database connection, protected admin access and subscription entitlement primitives.

**Architecture:** Extend the existing TypeScript monorepo without replacing its structure. PostgreSQL and PostGIS remain the source of truth through Drizzle schema. The NestJS API owns authentication, password hashing, token issuing, verification codes and role checks. Next.js admin becomes protected by an API-backed login flow. Mobile receives auth screens and token storage in a later task, after the API contract is stable.

**Tech Stack:** NestJS, Next.js, React Native Expo, PostgreSQL, PostGIS, Drizzle ORM, Zod, Vitest, Supertest, Argon2, JOSE JWT.

## Global Constraints

- Keep Android mobile first.
- Do not expose passwords, reset codes, access tokens or refresh tokens in logs.
- Use Argon2 for password hashing.
- Use server-side entitlement checks. The mobile app must not be the source of truth for paid access.
- Keep agricultural source status on sensitive agronomic rows.
- Calendar remains free.
- Map, crop detail, forum and Médico Agrícola require active subscription.
- Use Portuguese copy in user-facing surfaces.
- Commit after each completed task.
- Run targeted tests before each commit.

---

## File Structure

Create or modify these files:

- Modify `packages/database/src/schema.ts`: add auth, roles, plans, subscriptions and audit tables.
- Modify `packages/database/src/schema.test.ts`: assert new table and enum contracts.
- Create `packages/domain/src/auth.ts`: shared auth roles, permission names and entitlement helpers.
- Modify `packages/domain/src/index.ts`: export auth helpers.
- Create `packages/domain/src/auth.test.ts`: unit tests for roles and entitlements.
- Create `apps/api/src/modules/database/database.module.ts`: database provider from `DATABASE_URL`.
- Create `apps/api/src/modules/auth/auth.controller.ts`: register, verify, login, refresh, forgot password, reset password and me endpoints.
- Create `apps/api/src/modules/auth/auth.service.ts`: auth use cases.
- Create `apps/api/src/modules/auth/auth.repository.ts`: Drizzle-backed auth persistence.
- Create `apps/api/src/modules/auth/auth.tokens.ts`: JWT and refresh token helpers.
- Create `apps/api/src/modules/auth/auth.guard.ts`: Nest guard for access tokens.
- Create `apps/api/src/modules/auth/roles.guard.ts`: role guard and decorator.
- Create `apps/api/src/modules/auth/auth.schemas.ts`: Zod request schemas.
- Create `apps/api/src/modules/auth/auth.controller.test.ts`: endpoint tests.
- Modify `apps/api/src/app.module.ts`: register database and auth modules.
- Modify `apps/api/src/app.e2e-spec.ts`: include auth smoke coverage.
- Modify `apps/api/package.json`: add Argon2, JOSE and database driver dependencies.
- Create `apps/web/app/admin/login/page.tsx`: admin login page.
- Create `apps/web/app/admin/layout.tsx`: protected admin shell.
- Create `apps/web/app/api/admin/login/route.ts`: login proxy that sets HttpOnly cookie.
- Create `apps/web/app/api/admin/logout/route.ts`: logout proxy that clears cookie.
- Create `apps/web/middleware.ts`: protect `/admin` except `/admin/login`.
- Modify `apps/web/app/admin/page.tsx`: remove temporary copy and show authenticated admin dashboard skeleton.
- Create `apps/web/lib/admin-session.ts`: read admin session cookie.
- Create `apps/web/app/admin/login/page.test.tsx`: login rendering test.
- Modify `README.md`: document production foundation implementation status and commands.
- Modify `.env.example`: add required API and admin environment variables.

---

## Task 1: Database Auth And Subscription Schema

**Files:**

- Modify: `packages/database/src/schema.ts`
- Modify: `packages/database/src/schema.test.ts`

**Interfaces:**

- Produces: `authProviderEnum`, `verificationPurposeEnum`, `subscriptionStatusEnum`, `paymentStatusEnum`, `auditActionEnum`.
- Produces tables: `userProfiles`, `authAccounts`, `verificationCodes`, `refreshTokens`, `roles`, `userRoles`, `plans`, `subscriptions`, `paymentProviders`, `paymentAttempts`, `entitlements`, `auditLogs`.
- Consumed by later tasks through imports from `@ndjar/database`.

- [ ] **Step 1: Write failing schema tests**

Add tests to `packages/database/src/schema.test.ts`:

```ts
import {
  authAccounts,
  entitlements,
  paymentAttempts,
  plans,
  refreshTokens,
  roles,
  subscriptions,
  userProfiles,
  userRoles,
  verificationCodes,
} from "./schema";

describe("production auth schema", () => {
  it("exports auth and role tables", () => {
    expect(userProfiles).toBeDefined();
    expect(authAccounts).toBeDefined();
    expect(verificationCodes).toBeDefined();
    expect(refreshTokens).toBeDefined();
    expect(roles).toBeDefined();
    expect(userRoles).toBeDefined();
  });

  it("exports subscription and payment primitives", () => {
    expect(plans).toBeDefined();
    expect(subscriptions).toBeDefined();
    expect(paymentAttempts).toBeDefined();
    expect(entitlements).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @ndjar/database test -- schema.test.ts
```

Expected: fail because the new exports do not exist.

- [ ] **Step 3: Implement schema**

Add enums and tables to `packages/database/src/schema.ts`:

```ts
export const authProviderEnum = pgEnum("auth_provider", [
  "password",
  "sms_code",
  "admin_invite",
]);

export const verificationPurposeEnum = pgEnum("verification_purpose", [
  "account_verification",
  "password_reset",
  "phone_change",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "past_due",
  "expired",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "confirmed",
  "failed",
  "expired",
  "refunded",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "publish",
  "login",
  "logout",
  "payment_confirmed",
]);

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  fullName: text("full_name"),
  email: text("email"),
  phoneNumberHash: text("phone_number_hash"),
  phoneCountryCode: text("phone_country_code").default("245").notNull(),
  regionId: text("region_id").references(() => regions.id),
  communityId: text("community_id").references(() => communities.id),
  preferredLanguage: text("preferred_language").default("pt").notNull(),
  avatarStorageKey: text("avatar_storage_key"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  ...timestampColumns(),
});

export const authAccounts = pgTable("auth_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  provider: authProviderEnum("provider").default("password").notNull(),
  loginIdentifierHash: text("login_identifier_hash").notNull(),
  passwordHash: text("password_hash"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
  ...timestampColumns(),
});

export const verificationCodes = pgTable("verification_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  purpose: verificationPurposeEnum("purpose").notNull(),
  targetHash: text("target_hash").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  attempts: integer("attempts").default(0).notNull(),
  ...timestampColumns(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  userAgent: text("user_agent"),
  ipHash: text("ip_hash"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ...timestampColumns(),
});

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  ...timestampColumns(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id),
  assignedByUserId: uuid("assigned_by_user_id").references(() => users.id),
  ...timestampColumns(),
});

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  priceXof: integer("price_xof").notNull(),
  interval: text("interval").default("month").notNull(),
  includedConsultations: integer("included_consultations").default(3).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestampColumns(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  planId: text("plan_id")
    .notNull()
    .references(() => plans.id),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...timestampColumns(),
});

export const paymentProviders = pgTable("payment_providers", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  active: boolean("active").default(true).notNull(),
  logoStorageKey: text("logo_storage_key"),
  ...timestampColumns(),
});

export const paymentAttempts = pgTable("payment_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  providerId: text("provider_id")
    .notNull()
    .references(() => paymentProviders.id),
  planId: text("plan_id").references(() => plans.id),
  amountXof: integer("amount_xof").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  externalReference: text("external_reference"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ...timestampColumns(),
});

export const entitlements = pgTable("entitlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  featureKey: text("feature_key").notNull(),
  active: boolean("active").default(true).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ...timestampColumns(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  ...timestampColumns(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @ndjar/database test -- schema.test.ts
pnpm --filter @ndjar/database typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/database/src/schema.ts packages/database/src/schema.test.ts
git commit -m "feat: add production auth schema"
```

---

## Task 2: Shared Auth Domain Rules

**Files:**

- Create: `packages/domain/src/auth.ts`
- Create: `packages/domain/src/auth.test.ts`
- Modify: `packages/domain/src/index.ts`

**Interfaces:**

- Produces: `NDJAR_ROLES`, `PAID_FEATURES`, `canAccessAdmin(roleIds)`, `hasEntitlement(entitlements, featureKey, now)`.
- Consumed by API guards, admin UI and mobile gating.

- [ ] **Step 1: Write failing tests**

Create `packages/domain/src/auth.test.ts`:

```ts
import { canAccessAdmin, hasEntitlement, PAID_FEATURES } from "./auth";

describe("auth domain rules", () => {
  it("allows only admin and super admin into admin surfaces", () => {
    expect(canAccessAdmin(["farmer"])).toBe(false);
    expect(canAccessAdmin(["agricultural_doctor"])).toBe(false);
    expect(canAccessAdmin(["admin"])).toBe(true);
    expect(canAccessAdmin(["super_admin"])).toBe(true);
  });

  it("requires active unexpired entitlement for paid features", () => {
    expect(
      hasEntitlement(
        [
          {
            active: true,
            expiresAt: new Date("2026-08-01T00:00:00Z"),
            featureKey: PAID_FEATURES.map,
          },
        ],
        PAID_FEATURES.map,
        new Date("2026-07-10T00:00:00Z"),
      ),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @ndjar/domain test -- auth.test.ts
```

Expected: fail because `auth.ts` does not exist.

- [ ] **Step 3: Implement auth helpers**

Create `packages/domain/src/auth.ts`:

```ts
export const NDJAR_ROLES = {
  farmer: "farmer",
  agriculturalDoctor: "agricultural_doctor",
  admin: "admin",
  superAdmin: "super_admin",
} as const;

export type NdjarRole = (typeof NDJAR_ROLES)[keyof typeof NDJAR_ROLES];

export const PAID_FEATURES = {
  map: "map",
  cropDetails: "crop_details",
  forum: "forum",
  agriculturalDoctor: "agricultural_doctor",
} as const;

export type PaidFeature = (typeof PAID_FEATURES)[keyof typeof PAID_FEATURES];

export interface EntitlementSnapshot {
  active: boolean;
  expiresAt: Date | null;
  featureKey: string;
}

export function canAccessAdmin(roleIds: string[]) {
  return (
    roleIds.includes(NDJAR_ROLES.admin) ||
    roleIds.includes(NDJAR_ROLES.superAdmin)
  );
}

export function hasEntitlement(
  entitlements: EntitlementSnapshot[],
  featureKey: PaidFeature,
  now = new Date(),
) {
  return entitlements.some((entitlement) => {
    if (!entitlement.active || entitlement.featureKey !== featureKey) {
      return false;
    }

    return !entitlement.expiresAt || entitlement.expiresAt > now;
  });
}
```

Modify `packages/domain/src/index.ts`:

```ts
export * from "./auth";
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @ndjar/domain test -- auth.test.ts
pnpm --filter @ndjar/domain typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/auth.ts packages/domain/src/auth.test.ts packages/domain/src/index.ts
git commit -m "feat: add auth domain rules"
```

---

## Task 3: API Database Module And Environment Contract

**Files:**

- Create: `apps/api/src/modules/database/database.module.ts`
- Create: `apps/api/src/modules/database/database.module.test.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/package.json`
- Modify: `.env.example`

**Interfaces:**

- Produces: `DATABASE` injection token.
- Produces: `Database` type.
- Consumed by auth repository and future map/forum/payment modules.

- [ ] **Step 1: Add dependencies**

Run:

```bash
pnpm --filter @ndjar/api add postgres drizzle-orm
```

Expected: `apps/api/package.json` includes `postgres` and `drizzle-orm`.

- [ ] **Step 2: Write failing module test**

Create `apps/api/src/modules/database/database.module.test.ts`:

```ts
import { Test } from "@nestjs/testing";

import { DATABASE, DatabaseModule } from "./database.module";

describe("DatabaseModule", () => {
  it("throws a clear error when DATABASE_URL is missing", async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await expect(
      Test.createTestingModule({
        imports: [DatabaseModule],
      }).compile(),
    ).rejects.toThrow("DATABASE_URL is required");

    process.env.DATABASE_URL = original;
  });

  it("can be skipped in fixture mode", async () => {
    process.env.NDJAR_DATABASE_MODE = "fixture";
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    expect(module.get(DATABASE)).toBeNull();
    delete process.env.NDJAR_DATABASE_MODE;
  });
});
```

- [ ] **Step 3: Implement database module**

Create `apps/api/src/modules/database/database.module.ts`:

```ts
import { Global, Module } from "@nestjs/common";
import * as schema from "@ndjar/database";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const DATABASE = Symbol("DATABASE");

export type Database = ReturnType<typeof drizzle<typeof schema>>;

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory() {
        if (process.env.NDJAR_DATABASE_MODE === "fixture") {
          return null;
        }

        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error("DATABASE_URL is required");
        }

        const client = postgres(databaseUrl, { max: 10 });
        return drizzle(client, { schema });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
```

Modify `apps/api/src/app.module.ts`:

```ts
import { DatabaseModule } from "./modules/database/database.module.js";

@Module({
  imports: [DatabaseModule],
  ...
})
export class AppModule {}
```

Modify `.env.example`:

```env
DATABASE_URL=
NDJAR_DATABASE_MODE=fixture
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ADMIN_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @ndjar/api test -- database.module.test.ts
pnpm --filter @ndjar/api typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml .env.example apps/api/src/app.module.ts apps/api/src/modules/database
git commit -m "feat: add api database module"
```

---

## Task 4: API Auth Service And Endpoints

**Files:**

- Create: `apps/api/src/modules/auth/auth.schemas.ts`
- Create: `apps/api/src/modules/auth/auth.tokens.ts`
- Create: `apps/api/src/modules/auth/auth.repository.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.controller.test.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/package.json`

**Interfaces:**

- Produces endpoints:
  - `POST /auth/register`
  - `POST /auth/verify`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `GET /auth/me`
  - `POST /auth/logout`
- Produces response shape:

```ts
interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    displayName: string | null;
    roles: string[];
  };
}
```

- [ ] **Step 1: Add dependencies**

Run:

```bash
pnpm --filter @ndjar/api add argon2 jose
```

Expected: package updated.

- [ ] **Step 2: Write failing controller tests**

Create `apps/api/src/modules/auth/auth.controller.test.ts`:

```ts
import { randomBytes } from "node:crypto";
import { Test } from "@nestjs/testing";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

const authService = {
  register: vi.fn(),
  login: vi.fn(),
  me: vi.fn(),
};

describe("AuthController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a farmer account", async () => {
    authService.register.mockResolvedValue({
      userId: "user-1",
      verificationRequired: true,
    });

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    const controller = module.get(AuthController);
    await expect(
      controller.register({
        displayName: "Binta Cisse",
        password: randomBytes(24).toString("base64url"),
        phone: "+245956086144",
      }),
    ).resolves.toEqual({
      userId: "user-1",
      verificationRequired: true,
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pnpm --filter @ndjar/api test -- auth.controller.test.ts
```

Expected: fail because files do not exist.

- [ ] **Step 4: Implement schemas**

Create `apps/api/src/modules/auth/auth.schemas.ts`:

```ts
import { z } from "zod";

export const registerSchema = z.object({
  displayName: z.string().min(2).max(120),
  phone: z.string().min(8).max(32),
  email: z.string().email().optional(),
  password: z.string().min(10).max(200),
});

export const loginSchema = z.object({
  identifier: z.string().min(3).max(200),
  password: z.string().min(10).max(200),
});

export const verifySchema = z.object({
  userId: z.string().uuid(),
  code: z.string().min(4).max(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(3).max(200),
});

export const resetPasswordSchema = z.object({
  identifier: z.string().min(3).max(200),
  code: z.string().min(4).max(8),
  newPassword: z.string().min(10).max(200),
});
```

- [ ] **Step 5: Implement token helpers**

Create `apps/api/src/modules/auth/auth.tokens.ts`:

```ts
import { SignJWT, jwtVerify } from "jose";

export interface AccessTokenPayload {
  sub: string;
  roles: string[];
}

function secretFromEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return new TextEncoder().encode(value);
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ roles: payload.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretFromEnv("JWT_ACCESS_SECRET"));
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(token, secretFromEnv("JWT_ACCESS_SECRET"));
  return {
    roles: Array.isArray(result.payload.roles)
      ? result.payload.roles.map(String)
      : [],
    sub: result.payload.sub ?? "",
  };
}
```

- [ ] **Step 6: Implement repository and service**

Create `auth.repository.ts` with methods:

```ts
export interface AuthUserRecord {
  displayName: string | null;
  id: string;
  passwordHash: string;
  roles: string[];
}

export class AuthRepository {
  async createFarmerAccount(input: {
    displayName: string;
    identifierHash: string;
    passwordHash: string;
  }): Promise<{ userId: string }> {
    throw new Error("createFarmerAccount must use Drizzle transaction");
  }

  async findByIdentifierHash(
    identifierHash: string,
  ): Promise<AuthUserRecord | null> {
    throw new Error("findByIdentifierHash must query auth_accounts");
  }

  async createRefreshToken(userId: string): Promise<string> {
    throw new Error("createRefreshToken must persist a hashed refresh token");
  }
}
```

Create `auth.service.ts`:

```ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { hash, verify } from "argon2";
import { createHash, randomInt } from "node:crypto";

import { AuthRepository } from "./auth.repository.js";
import { signAccessToken } from "./auth.tokens.js";

function stableHash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async register(input: {
    displayName: string;
    password: string;
    phone: string;
  }) {
    const passwordHash = await hash(input.password);
    const result = await this.repository.createFarmerAccount({
      displayName: input.displayName,
      identifierHash: stableHash(input.phone),
      passwordHash,
    });

    return {
      devVerificationCode:
        process.env.NODE_ENV === "production"
          ? undefined
          : String(randomInt(100000, 999999)),
      userId: result.userId,
      verificationRequired: true,
    };
  }

  async login(input: { identifier: string; password: string }) {
    const user = await this.repository.findByIdentifierHash(
      stableHash(input.identifier),
    );

    if (!user || !(await verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return {
      accessToken: await signAccessToken({ roles: user.roles, sub: user.id }),
      refreshToken: await this.repository.createRefreshToken(user.id),
      user: {
        displayName: user.displayName,
        id: user.id,
        roles: user.roles,
      },
    };
  }
}
```

Complete the repository in the same task using Drizzle transactions. The repository must insert into `users`, `userProfiles`, `authAccounts`, `roles` seed if missing and `userRoles`.

- [ ] **Step 7: Implement controller and module**

Create controller:

```ts
import { Body, Controller, Get, Post } from "@nestjs/common";

import {
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifySchema,
} from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() body: unknown) {
    return this.authService.register(registerSchema.parse(body));
  }

  @Post("login")
  login(@Body() body: unknown) {
    return this.authService.login(loginSchema.parse(body));
  }

  @Post("verify")
  verify(@Body() body: unknown) {
    return this.authService.verify(verifySchema.parse(body));
  }

  @Post("refresh")
  refresh(@Body() body: unknown) {
    return this.authService.refresh(refreshSchema.parse(body));
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: unknown) {
    return this.authService.forgotPassword(forgotPasswordSchema.parse(body));
  }

  @Post("reset-password")
  resetPassword(@Body() body: unknown) {
    return this.authService.resetPassword(resetPasswordSchema.parse(body));
  }

  @Get("me")
  me() {
    return this.authService.me();
  }
}
```

- [ ] **Step 8: Run tests**

```bash
pnpm --filter @ndjar/api test -- auth.controller.test.ts
pnpm --filter @ndjar/api typecheck
```

Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add apps/api/package.json pnpm-lock.yaml apps/api/src/modules/auth apps/api/src/app.module.ts
git commit -m "feat: add api auth endpoints"
```

---

## Task 5: Access Token Guard And Role Guard

**Files:**

- Create: `apps/api/src/modules/auth/auth.guard.ts`
- Create: `apps/api/src/modules/auth/roles.guard.ts`
- Create: `apps/api/src/modules/auth/auth.guard.test.ts`
- Modify: `apps/api/src/modules/auth/auth.module.ts`

**Interfaces:**

- Produces: `AuthGuard`, `RolesGuard`, `@Roles(...roles)`.
- Consumed by future admin, map, crop, forum, payment and consultation controllers.

- [ ] **Step 1: Write failing guard tests**

Create `apps/api/src/modules/auth/auth.guard.test.ts`:

```ts
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";

import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
  it("rejects requests without bearer token", async () => {
    const guard = new AuthGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
```

- [ ] **Step 2: Implement guard**

Create `auth.guard.ts`:

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { verifyAccessToken } from "./auth.tokens.js";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: { id: string; roles: string[] };
    }>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Sessão obrigatória");
    }

    const payload = await verifyAccessToken(header.slice("Bearer ".length));
    request.user = { id: payload.sub, roles: payload.roles };
    return true;
  }
}
```

Create `roles.guard.ts`:

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { roles: string[] };
    }>();
    const allowed = request.user?.roles.some((role) => required.includes(role));

    if (!allowed) {
      throw new ForbiddenException("Permissão insuficiente");
    }

    return true;
  }
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @ndjar/api test -- auth.guard.test.ts
pnpm --filter @ndjar/api typecheck
```

Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/auth
git commit -m "feat: add api auth guards"
```

---

## Task 6: Admin Login And Protected Admin Shell

**Files:**

- Create: `apps/web/app/admin/login/page.tsx`
- Create: `apps/web/app/admin/layout.tsx`
- Create: `apps/web/app/api/admin/login/route.ts`
- Create: `apps/web/app/api/admin/logout/route.ts`
- Create: `apps/web/lib/admin-session.ts`
- Create: `apps/web/middleware.ts`
- Modify: `apps/web/app/admin/page.tsx`
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/app/admin/login/page.test.tsx`

**Interfaces:**

- Produces admin route protection based on `ndjar_admin_access` cookie.
- Consumes API endpoint `POST /auth/login`.

- [ ] **Step 1: Write failing login page test**

Create `apps/web/app/admin/login/page.test.tsx`:

```ts
import { renderToString } from "react-dom/server";

import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  it("renders login fields", () => {
    const html = renderToString(<AdminLoginPage />);
    expect(html).toContain("Entrar no N'djar Admin");
    expect(html).toContain("Telefone ou email");
    expect(html).toContain("Senha");
  });
});
```

- [ ] **Step 2: Implement admin login page**

Create `apps/web/app/admin/login/page.tsx`:

```tsx
export default function AdminLoginPage() {
  return (
    <main className="admin-login">
      <section className="admin-login-panel">
        <p className="eyebrow">Acesso protegido</p>
        <h1>Entrar no N'djar Admin</h1>
        <form action="/api/admin/login" method="post">
          <label>
            Telefone ou email
            <input name="identifier" required type="text" />
          </label>
          <label>
            Senha
            <input name="password" required type="password" />
          </label>
          <button type="submit">Entrar</button>
        </form>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Implement login proxy**

Create `apps/web/app/api/admin/login/route.ts`:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  const response = await fetch(`${process.env.NDJAR_API_URL}/auth/login`, {
    body: JSON.stringify({ identifier, password }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    redirect("/admin/login?error=invalid");
  }

  const session = (await response.json()) as { accessToken: string };
  const cookieStore = await cookies();
  cookieStore.set("ndjar_admin_access", session.accessToken, {
    httpOnly: true,
    maxAge: 60 * 15,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}
```

Create logout route:

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("ndjar_admin_access");
  redirect("/admin/login");
}
```

- [ ] **Step 4: Implement middleware**

Create `apps/web/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/admin/login";

  if (!isAdmin || isLogin) {
    return NextResponse.next();
  }

  const token = request.cookies.get("ndjar_admin_access");
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 5: Replace temporary admin copy**

Modify `apps/web/app/admin/page.tsx` so the title becomes:

```tsx
<h1 id="admin-title">Painel operacional N'djar</h1>
```

Replace the intro paragraph with:

```tsx
<p>
  Área protegida para gerir utilizadores, subscrições, mapa agrícola, culturas,
  fórum, consultas e notificações.
</p>
```

- [ ] **Step 6: Run tests**

```bash
pnpm --filter @ndjar/web test -- admin/login/page.test.tsx
pnpm --filter @ndjar/web typecheck
pnpm --filter @ndjar/web lint
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/admin apps/web/app/api/admin apps/web/lib apps/web/middleware.ts apps/web/app/globals.css
git commit -m "feat: protect admin login"
```

---

## Task 7: API Entitlement Check Endpoint

**Files:**

- Create: `apps/api/src/modules/entitlements/entitlements.controller.ts`
- Create: `apps/api/src/modules/entitlements/entitlements.service.ts`
- Create: `apps/api/src/modules/entitlements/entitlements.controller.test.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**

- Produces endpoint `GET /entitlements/me`.
- Response:

```ts
{
  features: {
    agriculturalDoctor: boolean;
    cropDetails: boolean;
    forum: boolean;
    map: boolean;
  };
  subscription: {
    expiresAt: string | null;
    status: string;
  } | null;
}
```

- [ ] **Step 1: Write failing controller test**

Create `entitlements.controller.test.ts`:

```ts
import { Test } from "@nestjs/testing";

import { EntitlementsController } from "./entitlements.controller";
import { EntitlementsService } from "./entitlements.service";

describe("EntitlementsController", () => {
  it("returns paid feature access for current user", async () => {
    const module = await Test.createTestingModule({
      controllers: [EntitlementsController],
      providers: [
        {
          provide: EntitlementsService,
          useValue: {
            getCurrentUserEntitlements: vi.fn().mockResolvedValue({
              features: {
                agriculturalDoctor: true,
                cropDetails: true,
                forum: true,
                map: true,
              },
              subscription: {
                expiresAt: "2026-08-10T00:00:00.000Z",
                status: "active",
              },
            }),
          },
        },
      ],
    }).compile();

    await expect(module.get(EntitlementsController).me()).resolves.toEqual({
      features: {
        agriculturalDoctor: true,
        cropDetails: true,
        forum: true,
        map: true,
      },
      subscription: { expiresAt: "2026-08-10T00:00:00.000Z", status: "active" },
    });
  });
});
```

- [ ] **Step 2: Implement controller and service**

Create `entitlements.service.ts`:

```ts
import { Injectable } from "@nestjs/common";

@Injectable()
export class EntitlementsService {
  async getCurrentUserEntitlements() {
    return {
      features: {
        agriculturalDoctor: false,
        cropDetails: false,
        forum: false,
        map: false,
      },
      subscription: null,
    };
  }
}
```

Create `entitlements.controller.ts`:

```ts
import { Controller, Get, UseGuards } from "@nestjs/common";

import { AuthGuard } from "../auth/auth.guard.js";
import { EntitlementsService } from "./entitlements.service.js";

@Controller("entitlements")
export class EntitlementsController {
  constructor(private readonly service: EntitlementsService) {}

  @Get("me")
  @UseGuards(AuthGuard)
  me() {
    return this.service.getCurrentUserEntitlements();
  }
}
```

- [ ] **Step 3: Register module in app**

Add `EntitlementsController` and `EntitlementsService` to `AppModule`.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @ndjar/api test -- entitlements.controller.test.ts
pnpm --filter @ndjar/api typecheck
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/entitlements apps/api/src/app.module.ts
git commit -m "feat: expose entitlement status"
```

---

## Task 8: Documentation And Verification

**Files:**

- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-10-ndjar-production-platform-design.md` only if implementation discovers a contradiction.

**Interfaces:**

- Produces current setup commands and final status in documentation.

- [ ] **Step 1: Update README implementation status**

Add under Current Status:

```md
- Production foundation implementation started: authentication schema, API auth endpoints, protected admin shell and entitlement endpoint.
```

Add environment section:

````md
Production foundation environment:

```bash
DATABASE_URL=
NDJAR_DATABASE_MODE=fixture
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
NDJAR_API_URL=http://localhost:3333
```
````

````

- [ ] **Step 2: Run full targeted verification**

Run:

```bash
pnpm --filter @ndjar/database test
pnpm --filter @ndjar/domain test
pnpm --filter @ndjar/api test
pnpm --filter @ndjar/web test
pnpm --filter @ndjar/database typecheck
pnpm --filter @ndjar/domain typecheck
pnpm --filter @ndjar/api typecheck
pnpm --filter @ndjar/web typecheck
pnpm --filter @ndjar/api lint
pnpm --filter @ndjar/web lint
````

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/superpowers/specs/2026-07-10-ndjar-production-platform-design.md
git commit -m "docs: document production foundation setup"
```

---

## Self-Review

Spec coverage:

- Authentication: covered by Tasks 1, 2, 4 and 5.
- Roles and permissions: covered by Tasks 1, 2 and 5.
- Database foundation: covered by Tasks 1 and 3.
- Protected admin: covered by Task 6.
- Subscription entitlement primitive: covered by Tasks 1, 2 and 7.
- README update: covered by Task 8.

Deliberately deferred to separate plans:

- Real map with PostGIS editor.
- Payment provider integration.
- Forum with images.
- Médico Agrícola full consultant queue.
- Mobile auth screens.
- Notifications.
- Offline sync and USSD.

Reason for deferral: these depend on stable auth, roles, database and protected admin surfaces.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-10-production-foundation-auth-db-admin.md`.

Two execution options:

1. Subagent-Driven (recommended): dispatch a fresh subagent per task, review between tasks and commit after each approved task.
2. Inline Execution: execute tasks in this session with checkpoints after each task.

Recommended choice: Subagent-Driven. The tasks are independent enough for parallel review, but they touch shared contracts, so each task should be reviewed before the next dependent task starts.
