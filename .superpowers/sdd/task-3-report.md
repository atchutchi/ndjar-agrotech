# Task 3 Report

## Scope

Added the global API database module and the environment contract for the production foundation. The module exports the `DATABASE` injection token and the `Database` type for later repositories and modules.

## TDD Trace

Created `apps/api/src/modules/database/database.module.test.ts` before the module. The first execution failed because `database.module.ts` did not exist. After implementing the module, the focused command passed with 2 database-module tests and 8 existing API integration tests.

The current Vitest command includes the API integration test as well as the requested file. `apps/api/vitest.config.ts` therefore defines `NDJAR_DATABASE_MODE=fixture` for tests. The database-module test explicitly removes that mode when verifying the missing `DATABASE_URL` error, then restores the prior environment values.

## Implementation

Added `postgres` and `drizzle-orm` to `@ndjar/api`. `DatabaseModule` is global, returns `null` in fixture mode, otherwise requires `DATABASE_URL`, creates a PostgreSQL client with a maximum of 10 connections and exposes the Drizzle instance configured with `@ndjar/database` schema exports.

Registered `DatabaseModule` in `AppModule` and replaced `.env.example` with the requested database, JWT and admin application variables.

## Validation

- `corepack pnpm --filter @ndjar/api test -- database.module.test.ts`: passed, 2 files and 10 tests.
- `corepack pnpm --filter @ndjar/api typecheck`: passed.
- `corepack pnpm --filter @ndjar/api lint`: passed.
- `git diff --check`: passed.

## Concerns

The Vitest environment adjustment is necessary because the required test command also executes the existing `app.e2e-spec.ts`; it is deliberately test-only and does not set fixture mode for production execution.
