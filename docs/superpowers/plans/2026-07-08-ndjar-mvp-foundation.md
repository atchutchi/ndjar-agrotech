# N'djar MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation for the N'djar Android-first MVP, with web/admin and backend architecture ready for maps, offline data, consultations, controlled AI answers and future USSD.

**Architecture:** Use a TypeScript monorepo with Expo for Android, Next.js for public web/admin, NestJS API, PostgreSQL with PostGIS, shared domain packages and seed data for the southern pilot. Keep USSD as a phase 2 integration while modelling the data early.

**Tech Stack:** TypeScript, pnpm workspaces, Expo, React Native, Next.js, NestJS, Drizzle, PostgreSQL, PostGIS, Redis, BullMQ, Zod, TanStack Query, Zustand, React Hook Form, MapLibre, Expo SQLite, Remotion.

## Execution Status

Tasks 1 to 8 are implemented and reviewed in branch `agent/mvp-foundation`.

Task 9 is updating project documentation, running final verification and pushing the implementation branch to GitHub.

## Global Constraints

Android mobile comes first.

Web comes after mobile and must serve public pages plus admin workflows.

Pilot data starts with the southern Guinea-Bissau diagnosis reports.

USSD is phase 2, but backend models must not block future USSD sessions.

AI answers must use predefined reviewed knowledge first and escalate unsafe questions to agricultural doctors.

No production external account is created without explicit permission.

Do not commit private legal, banking, identity or passport documents.

Every meaningful change updates README when user-facing scope changes.

---

### Task 1: Monorepo Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Produces: workspace scripts `dev`, `build`, `test`, `lint`, `typecheck`, `format`.
- Produces: shared TypeScript configuration for all apps and packages.

- [ ] **Step 1: Create workspace package file**

Create `package.json` with pnpm workspace scripts and core dev dependencies.

- [ ] **Step 2: Create workspace definition**

Create `pnpm-workspace.yaml` with `apps/*` and `packages/*`.

- [ ] **Step 3: Install dependencies**

Run: `pnpm install`

Expected: lockfile created and workspace install completed.

- [ ] **Step 4: Verify workspace commands**

Run: `pnpm typecheck`

Expected: command exists. It may report no projects until apps are created.

- [ ] **Step 5: Commit**

Run: `git add . && git commit -m "chore: add monorepo foundation"`

### Task 2: Shared Domain Package

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/src/agronomy.ts`
- Create: `packages/domain/src/consultations.ts`
- Create: `packages/domain/src/offline.ts`
- Create: `packages/domain/src/ussd.ts`
- Create: `packages/domain/src/agronomy.test.ts`

**Interfaces:**
- Produces: `AgronomicSourceStatus`.
- Produces: `classifyPhValue(value: number): PhClass`.
- Produces: `shouldEscalateQuestion(input: ConsultationQuestion): EscalationDecision`.

- [ ] **Step 1: Write domain tests**

Test pH classification, source status and consultation escalation.

- [ ] **Step 2: Implement domain types**

Implement typed statuses and pure functions.

- [ ] **Step 3: Run tests**

Run: `pnpm --filter @ndjar/domain test`

Expected: all domain tests pass.

- [ ] **Step 4: Commit**

Run: `git add packages/domain && git commit -m "feat: add agricultural domain rules"`

### Task 3: Pilot Data Fixtures

**Files:**
- Create: `packages/fixtures/package.json`
- Create: `packages/fixtures/src/pilot-south.ts`
- Create: `packages/fixtures/src/crops.ts`
- Create: `packages/fixtures/src/calendar.ts`
- Create: `docs/data/pilot-south-source-notes.md`

**Interfaces:**
- Consumes: domain types from `@ndjar/domain`.
- Produces: `pilotSouthRegions`, `pilotCrops`, `pilotCalendarTasks`.

- [ ] **Step 1: Create source notes**

Document which local reports support each pilot fixture.

- [ ] **Step 2: Create safe fixture data**

Mark all uncertain pH values as `estimated` or `example`.

- [ ] **Step 3: Validate fixtures**

Run fixture typecheck through the workspace.

- [ ] **Step 4: Commit**

Run: `git add packages/fixtures docs/data && git commit -m "feat: add southern pilot fixtures"`

### Task 4: Database Foundation

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/src/schema.ts`
- Create: `packages/database/drizzle.config.ts`
- Create: `packages/database/src/seed.ts`
- Create: `docs/data/database-model.md`

**Interfaces:**
- Consumes: fixtures from `@ndjar/fixtures`.
- Produces: PostgreSQL and PostGIS tables for users, regions, communities, crops, samples, consultations, answer templates, notification jobs and USSD sessions.

- [ ] **Step 1: Define schema**

Create Drizzle schema with PostGIS-ready region fields and source status fields.

- [ ] **Step 2: Add seed script**

Seed pilot regions, communities, crops and calendar tasks.

- [ ] **Step 3: Validate schema**

Run: `pnpm --filter @ndjar/database typecheck`

Expected: schema validates.

- [ ] **Step 4: Commit**

Run: `git add packages/database docs/data && git commit -m "feat: add database schema foundation"`

### Task 5: API Foundation

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/modules/regions/regions.controller.ts`
- Create: `apps/api/src/modules/crops/crops.controller.ts`
- Create: `apps/api/src/modules/consultations/consultations.controller.ts`
- Create: `apps/api/src/modules/assistant/assistant.controller.ts`
- Create: `apps/api/src/modules/sync/sync.controller.ts`
- Create: `apps/api/src/modules/ussd-preview/ussd-preview.controller.ts`
- Create: `apps/api/src/app.e2e-spec.ts`

**Interfaces:**
- Produces: NestJS REST routes for mobile and web.
- Produces: assistant route that returns reviewed answer or escalation decision.

- [ ] **Step 1: Write API smoke tests**

Test health, regions and assistant escalation.

- [ ] **Step 2: Implement NestJS server**

Create typed controllers and services with Zod validation.

- [ ] **Step 3: Run API tests**

Run: `pnpm --filter @ndjar/api test`

Expected: all API smoke tests pass.

- [ ] **Step 4: Commit**

Run: `git add apps/api && git commit -m "feat: add api foundation"`

### Task 6: Mobile Foundation

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/src/App.tsx`
- Create: `apps/mobile/src/navigation/tabs.tsx`
- Create: `apps/mobile/src/screens/HomeScreen.tsx`
- Create: `apps/mobile/src/screens/MapScreen.tsx`
- Create: `apps/mobile/src/screens/DoctorScreen.tsx`
- Create: `apps/mobile/src/screens/ForumScreen.tsx`
- Create: `apps/mobile/src/screens/ProfileScreen.tsx`
- Create: `apps/mobile/src/storage/offlineStore.ts`

**Interfaces:**
- Consumes: API routes and fixture fallback data.
- Produces: Android-first navigation and offline-ready screens.

- [ ] **Step 1: Create Expo app**

Create Expo app structure using TypeScript.

- [ ] **Step 2: Add bottom navigation**

Tabs are Home, Map, Doctor, Forum and Profile.

- [ ] **Step 3: Add offline store**

Use local storage for pilot content and drafts.

- [ ] **Step 4: Run mobile typecheck**

Run: `pnpm --filter @ndjar/mobile typecheck`

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

Run: `git add apps/mobile && git commit -m "feat: add android app foundation"`

### Task 7: Web Foundation

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/admin/page.tsx`
- Create: `apps/web/app/api/health/route.ts`
- Create: `apps/web/next.config.ts`

**Interfaces:**
- Produces: public web overview and admin entry point.

- [ ] **Step 1: Create Next.js app**

Use App Router and TypeScript.

- [ ] **Step 2: Build public homepage**

Explain N'djar, pilot, services and contact.

- [ ] **Step 3: Build admin placeholder**

List future admin modules and protect production work behind auth later.

- [ ] **Step 4: Run web checks**

Run: `pnpm --filter @ndjar/web typecheck`

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

Run: `git add apps/web && git commit -m "feat: add web foundation"`

### Task 8: Design System Package

**Files:**
- Create: `packages/design-system/package.json`
- Create: `packages/design-system/src/tokens.ts`
- Create: `docs/design/design-system.md`
- Create: `docs/design/wireframes.md`

**Interfaces:**
- Produces: reusable N'djar tokens.
- Consumes: prototype colours and ui-ux-pro-max recommendations.

- [ ] **Step 1: Define tokens**

Create colours, typography, spacing, radius and status tokens.

- [ ] **Step 2: Document wireframes**

Map the 24 prototype screens to app routes and components.

- [ ] **Step 3: Commit**

Run: `git add packages/design-system docs/design && git commit -m "docs: add design system foundation"`

### Task 9: Verification and Push

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-07-08-ndjar-mvp-foundation.md`

**Interfaces:**
- Produces: pushed branch on GitHub.

- [ ] **Step 1: Run checks**

Run: `pnpm lint && pnpm typecheck && pnpm test`

Expected: all available checks pass.

- [ ] **Step 2: Update README**

Record implemented features and current limitations.

- [ ] **Step 3: Commit README update**

Run: `git add README.md docs && git commit -m "docs: update project status"`

- [ ] **Step 4: Push**

Run: `git push -u origin agent/mvp-foundation`

Expected: GitHub receives the latest implementation branch.
