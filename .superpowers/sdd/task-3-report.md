# Task 3 Report

## Scope

Implemented only the pilot fixture work for Task 3 in the `agent/mvp-foundation` worktree.

Files added or updated:

- `packages/fixtures/package.json`
- `packages/fixtures/tsconfig.json`
- `packages/fixtures/src/index.ts`
- `packages/fixtures/src/pilot-south.ts`
- `packages/fixtures/src/crops.ts`
- `packages/fixtures/src/calendar.ts`
- `packages/fixtures/src/fixtures.test.ts`
- `docs/data/pilot-south-source-notes.md`
- `pnpm-lock.yaml`

## TDD Trace

Started with `packages/fixtures/src/fixtures.test.ts`.

First red run:

- Command: `pnpm --filter @ndjar/fixtures test`
- Result: failed because `./index.js` did not exist yet.

Green run after implementation:

- Command: `pnpm --filter @ndjar/fixtures test`
- Result: 3 tests passed.

## What Was Implemented

Created a new workspace package `@ndjar/fixtures` that exports:

- `pilotSouthRegions`
- `pilotCrops`
- `pilotCalendarTasks`

The fixture package consumes `AgronomicSourceStatus` and `SoilSampleRecord` behavior from `@ndjar/domain` and uses `createSampleRecord` for the cautious pH example path.

`pilotSouthRegions`

- Adds the pilot scope for Quinara, Buba, Sare Donha 1, Sare Donha 2, Uane and Ugui.
- Stores grouped area cautiously as a balanced split inside each pair because the brief gives only pair totals, not validated per-community totals.
- Keeps geographic and crop-presence facts as `field_observed`.
- Stores the placeholder pH sample as `example`, not validated, with method `unknown`.

`pilotCrops`

- Adds the observed crop list for Sare Donha and Uane/Ugui.
- Marks observed crop presence as `field_observed`.
- Marks mandioca production evidence of more than 20 bags of 200 kg per year as `self_reported`.
- Captures the declining mandioca yield note in Sare Donha as `field_observed`.

`pilotCalendarTasks`

- Covers the required September to August cycle.
- Includes rainy and dry season structure plus preparation, planting, weeding, harvest and threshing tasks.
- Keeps every calendar row at `estimated` because the sequence is not validated by crop and zone.

## Source Notes

Expanded `docs/data/pilot-south-source-notes.md` so the file now maps each fixture file to the supporting source group and explains why each sensitive datum uses its specific source status.

The note also makes explicit that no private legal or identity material is used.

## Validation

Executed:

- `pnpm --filter @ndjar/fixtures test`
- `pnpm --filter @ndjar/fixtures typecheck`
- `pnpm typecheck`

All passed.

## Concerns

The per-community hectare split is an implementation convenience derived from pair totals. It is not confirmed by a source at community level and should be replaced if a validated breakdown appears.

The pH record is intentionally only an example record to preserve UI and type flow without implying real agronomic validation.

---

# Production Foundation Task 3 Report

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
