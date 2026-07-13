# N'djar Agrotech

N'djar is a mobile-first agricultural decision platform for Guinea-Bissau. The current MVP foundation focuses first on Android, then web and admin. The first pilot area is the southern diagnosis scope around Quinara, Buba, Sare Donha 1, Sare Donha 2, Uane and Ugui.

The product helps farmers, field teams and agricultural consultants work with soil pH, crop observations, agricultural calendars, local knowledge, safe consultation triage and future USSD access. The assistant is intentionally deterministic in this foundation. It only returns predefined safe answers and escalates unsafe or unknown questions to an agricultural doctor workflow.

## Table of Contents

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Strategy](#strategy)
4. [Final Product Specification](#final-product-specification)
5. [User Stories](#user-stories)
6. [Skeleton](#skeleton)
7. [Features](#features)
8. [SEO](#seo)
9. [Wireframes](#wireframes)
10. [Local Setup](#local-setup)
11. [Testing](#testing)
12. [Security](#security)
13. [Feature Troubleshooting](#feature-troubleshooting)
14. [Future Development](#future-development)
15. [Accessibility](#accessibility)
16. [Deployment](#deployment)
17. [Credits](#credits)
18. [Code](#code)
19. [Storage](#storage)
20. [Database](#database)
21. [Languages and Technologies Used](#languages-and-technologies-used)

## Overview

The repository is now a TypeScript monorepo with shared packages and three application foundations:

- `apps/mobile`: Expo React Native Android-first app with bottom tabs, stack-style back navigation, interactive offline pilot map, realistic local image assets, offline fixture snapshot and consultation triage.
- `apps/web`: Next.js public web and protected admin shell.
- `apps/api`: NestJS fixture-backed REST API for mobile and web.
- `packages/domain`: shared agronomic rules, pH classification, consultation escalation, offline and USSD domain logic.
- `packages/fixtures`: southern pilot seed fixtures with explicit source status.
- `packages/database`: Drizzle PostgreSQL and PostGIS-ready schema plus typed pilot seed mapping.
- `packages/design-system`: N'djar tokens for colour, typography, spacing, radius, pH states, breakpoints and touch targets.

The prototype reference is `ndjar_app_prototipos_frontend.png`. It is used as a design reference only. It is not committed as a production asset.

## Current Status

Implemented in this branch:

- Monorepo tooling with `pnpm`, Turborepo and shared TypeScript config.
- Domain rules for pH, source status, offline strategy, USSD session state and consultation escalation.
- Southern pilot fixtures for Quinara/Buba with cautious source status.
- PostgreSQL and PostGIS-ready schema for regions, communities, crops, samples, consultations, answer templates, notification jobs and USSD sessions.
- NestJS API with health, regions, crops, consultations, assistant, sync and USSD preview routes.
- Expo Android app foundation with Home, Map, Doctor, Forum and Profile tabs.
- Mobile redesign pass with realistic generated agriculture imagery, official N'djar logo assets, Android back handling, clickable module blocks, visible consultant escalation tickets and an interactive offline map view for the Quinara/Buba pilot.
- Subscription-gated mobile journey: calendar stays free, while map, crop information, forum and agricultural doctor flows are guarded by a 15,000 XOF farmer plan.
- Simulated Orange Money and TeleTaku payment actions for MVP testing. No real payment provider is connected yet.
- Realistic crop image assets for rice, cassava, maize, beans, pumpkin, okra, yam, sweet potato and leafy vegetables, replacing placeholder icons in crop pH cards.
- Free interactive agricultural calendar extracted from `CALENDARIO AGRICULTURAL.xlsx`, with month selector, crop groups, colour-coded activity cells and incomplete data marked as pending.
- About page with N'djar mission, values and SDG assets copied from the project material.
- Next.js public web page, protected admin shell and health route.
- Initial brand guide, wireframes and reusable design tokens.
- Playwright added for repeatable web/admin smoke testing.
- Final production platform specification added at `docs/superpowers/specs/2026-07-10-ndjar-production-platform-design.md`.
- Orange Money and TeleTaku payment assets added for the next subscription button implementation.
- Production foundation implementation: authentication schema, API authentication endpoints, `AuthGuard`, `RolesGuard`, protected admin login shell and entitlement endpoint.
- Secret scanning is active in local checks and GitHub Actions.

Important limitations:

- The PostgreSQL schema is implemented, but no database has been provisioned and no migrations have been applied.
- The mobile presentation APK uses a pure React Native offline pilot map with public Buba coordinates and estimated community points. This avoids native map crashes in local APK demos. The community geometry is still approximate until validated GPS data is supplied.
- A production map should use a validated GIS stack such as MapLibre, Mapbox or MapTiler in a development build, with API keys, offline tile strategy and tested Android native configuration.
- No live USSD short code is connected.
- No free-form AI advice is enabled.
- Mobile offline storage is an in-memory foundation for now, not durable device storage.
- Authentication, role guards, the protected admin shell and the entitlement endpoint are implemented in code. Real login and real entitlement reads require a provisioned PostgreSQL database with the schema applied.
- Subscription state in the mobile MVP remains simulated. There are no real payment provider callbacks, invoices or receipt workflows.
- There is no email or SMS delivery integration, GIS editor, admin CRUD, complete forum backend or complete production query layer yet.
- External branch protection still needs to require the trusted secret-scan check. The pinned `pre-commit/action` still has mutable transitive dependencies managed by its provider; this risk is recorded without changing the workflow in this task.
- Full 3D terrain/vector GIS is not in the Expo Go prototype. That likely needs a development build with MapLibre, Mapbox or MapTiler plus validated geodata.

## Strategy

Phase 1 is a digital MVP. It validates the Android journey, the shared data model, the safe consultation flow and the pilot content structure.

Phase 2 adds USSD and short-code access. The backend already models USSD sessions, but there is no telecom integration in this branch.

Phase 3 adds GPS validation, stronger GIS layers, more regions, consultant operations, durable offline sync, payments and production deployment.

The commercial MVP model is subscription-first. The calendar remains a free acquisition and trust feature. Technical modules that require field studies, agronomic validation or consultant time should sit behind the paid plan:

- Free: agricultural calendar and basic project information.
- Paid: interactive map, soil and pasture suitability, crop pH cards, forum participation and agricultural doctor consultation.
- Simulated in this branch: 15,000 XOF farmer plan, Orange Money payment button and TeleTaku payment button.
- Required before launch: payment provider approval, server-side entitlement checks, receipt records, refund policy, subscription expiry and consultant service-level rules.

The main product risk is agronomic accuracy. The app must not present estimated or example data as validated truth. Every sensitive row keeps a source status such as `field_observed`, `estimated`, `example`, `self_reported`, `lab_validated` or `consultant_reviewed`.

## Final Product Specification

The approved final product direction is documented in `docs/superpowers/specs/2026-07-10-ndjar-production-platform-design.md`.

The specification covers:

- production architecture.
- complete user stories.
- farmer, consultant and admin flows.
- authentication, roles and permissions.
- real map with PostgreSQL and PostGIS.
- admin map editing with GPS coordinates, polygons and published layers.
- crop, soil, pH and calendar management.
- forum with images, moderation and verified consultant answers.
- Médico Agrícola chat, consultant queue, visit requests and service pricing.
- Orange Money and TeleTaku payment flow.
- push notifications.
- implementation roadmap and test criteria.

The next operational integration work is database provisioning and migrations, followed by the real map, forum, payments and Médico Agrícola workflows. The authentication, roles and protected admin foundation is already implemented in code.

## User Stories

Farmer:

- As a farmer, I want to open the calendar for free so that I can see seasonal tasks before deciding whether to subscribe.
- As a farmer, I want to select a month in the agricultural calendar so that I can see what activities are active for cereals, rice, amendoim and tubers.
- As a farmer, I want incomplete calendar data to be clearly marked so that I do not treat missing information as a recommendation.
- As a farmer, I want to pay 15,000 XOF with Orange Money or TeleTaku so that I can unlock technical modules.
- As a farmer in Quinara, I want to see my pilot region, communities and pH context so that I understand the current information before asking for help.
- As a farmer, I want to tap a map zone and see soil, pH, crop and animal pasture guidance so that I can decide whether to cultivate, sample or request technical help.
- As a farmer, I want crop pages to show recognisable crop images so that I do not confuse rice, maize, cassava or other crops.
- As a farmer with weak internet, I want the app to open with saved pilot content so that I can keep using basic information offline.
- As a farmer with a crop problem, I want to ask a question and either receive a safe predefined answer or have it escalated to an agricultural doctor.
- As a farmer collecting a soil sample, I want the future app to store parcel, community, crop, coordinates and photo as a draft.

Agricultural doctor:

- As an agricultural doctor, I want unsafe or unknown questions to arrive in a review queue so that I can answer within 24 hours.
- As an agricultural doctor, I want to see crop, region, source status and sample context before advising.
- As an agricultural doctor, I want predefined answers to be reviewed and auditable.

Admin:

- As an admin, I want to manage regions, communities, crops, pH records, calendars, templates and library content.
- As an admin, I want to moderate forum content so that unsafe advice does not spread.
- As an admin, I want data source status visible before publishing recommendations.

Public website visitor:

- As a partner, funder or cooperative, I want to understand the pilot, services and contact path.
- As a partner, I want to see the SDGs connected to N'djar so that I understand the impact positioning.
- As a technical partner, I want to see that the MVP separates mobile, web, API, database, domain rules and fixtures.

## Skeleton

```text
ndjar-agrotech/
  apps/
    api/
    mobile/
    web/
  packages/
    database/
    design-system/
    domain/
    fixtures/
  docs/
    data/
    design/
    product/
    superpowers/
  package.json
  pnpm-workspace.yaml
  turbo.json
```

## Features

Implemented foundation:

- Android app shell with five tabs.
- Home dashboard redesigned as large mobile module blocks: Calendar, Map, Subscription, Crop Information, Forum, Agricultural Doctor, About and Contact.
- Subscription page with 15,000 XOF farmer plan and simulated Orange Money and TeleTaku activation.
- Creative mobile agricultural calendar with a month carousel, active monthly tasks, selectable crop groups and a compact colour-coded table by phase.
- Interactive offline pilot map with Buba coordinates, estimated community points and selectable soil guidance cards.
- Region, calendar, sample and crop detail flows reachable from mobile cards, with Android hardware back navigation.
- Crop detail cards with realistic generated crop images instead of generic placeholder icons.
- Doctor triage screen using local deterministic safety rules, quick questions and local consultant ticket creation.
- Forum topics with clickable discussion detail and offline draft saving.
- Profile screen with clickable data, parcel, sample and sync states.
- About page with official N'djar icon, mission, values and project SDGs.
- Contact page for farmer, cooperative, NGO, government and partner support.
- API assistant route with 24-hour escalation.
- API offline sync route returning pilot fixture data.
- Web homepage for the N'djar MVP and pilot.
- Protected web admin shell with future management workflows still marked as planned.
- Database schema ready for PostGIS and future USSD sessions.
- Design tokens and brand guide.

Planned MVP features not complete yet:

- Login and registration by phone.
- Real subscription account model with start date, expiry date, renewal, failed payment handling and server-side access control.
- Production Orange Money and TeleTaku integration.
- Durable offline storage with Expo SQLite or equivalent.
- Real map layer with validated coordinates.
- True 3D terrain/vector GIS layer.
- Soil sample photo capture and upload.
- Consultant dashboard with assignments.
- Moderated forum workflows.
- Library downloads for offline reading.
- Subscription and payment workflows.

Calendar content currently extracted from the project Excel:

- Cereals of sequeiro: sorgo, milho, arroz de sequeiro and niebé.
- Rice in lowland areas.
- Amendoim.
- Tubers: mandioca, batata doce, inhame, manfafa and batata inglesa.
- Legumes: visible as a pending group because the spreadsheet includes the group but does not mark months.

## SEO

The web foundation includes metadata for the public site. Initial SEO targets:

- N'djar agricultural support.
- Agriculture in Guinea-Bissau.
- Soil pH and crop suitability.
- Agricultural doctor support.
- Quinara and Buba pilot.
- USSD agriculture information in a future phase.

Each future public page should keep a clear title, description, structured headings and human-readable URL.

## Wireframes

The 24 prototype screens are mapped in `docs/design/wireframes.md`.

Mobile route groups:

- Onboarding and language.
- Home and pilot summary.
- Map, region detail and pH context.
- Crops and crop detail.
- Calendar and sample registration.
- Agricultural doctor and consultations.
- Forum and discussion.
- Library, subscription, contact and profile.

Web route groups:

- `/`: public MVP overview.
- `/admin`: protected admin shell; operational CRUD modules remain future work.
- `/api/health`: web health route.

## Local Setup

Enable the pinned package manager and install the locked workspace dependencies:

```powershell
corepack enable
corepack pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

The local environment contract is:

```dotenv
DATABASE_URL=
NDJAR_DATABASE_MODE=fixture
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
NDJAR_API_URL=http://localhost:3333
```

`NDJAR_DATABASE_MODE=fixture` lets the API start without a database for fixture-backed routes. Real login and real entitlements require PostgreSQL, a non-empty `DATABASE_URL` and the schema applied.

Keep the JWT fields empty in `.env`. Generate runtime-only secrets in the current PowerShell process. This command uses `RandomNumberGenerator`, does not print a secret and does not write one to disk:

```powershell
function New-NdjarRuntimeSecret {
  $bytes = [byte[]]::new(48)
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}
$env:JWT_ACCESS_SECRET = New-NdjarRuntimeSecret
$env:JWT_REFRESH_SECRET = New-NdjarRuntimeSecret
Remove-Item function:New-NdjarRuntimeSecret
```

Run the API and web applications in separate terminals after setting their required runtime environment:

```powershell
corepack pnpm --filter @ndjar/api dev
corepack pnpm --filter @ndjar/web dev
```

## Testing

Repository commands:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Production foundation verification:

```bash
corepack pnpm --filter @ndjar/database test
corepack pnpm --filter @ndjar/domain test
corepack pnpm --filter @ndjar/api test
corepack pnpm --filter @ndjar/web test
corepack pnpm --filter @ndjar/database typecheck
corepack pnpm --filter @ndjar/domain typecheck
corepack pnpm --filter @ndjar/api typecheck
corepack pnpm --filter @ndjar/web typecheck
corepack pnpm --filter @ndjar/api lint
corepack pnpm --filter @ndjar/web lint
corepack pnpm --filter @ndjar/api build
corepack pnpm --filter @ndjar/web build
git diff --check
py -m pre_commit run detect-secrets --all-files
```

Mobile Expo validation:

```bash
pnpm --filter @ndjar/mobile exec expo install --check
pnpm --filter @ndjar/mobile exec expo export --platform android --output-dir .expo-export-test --no-minify
```

Android local run:

```bash
pnpm --filter @ndjar/mobile exec expo start --android --clear
```

Android presentation APK:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-mobile-presentation-apk.ps1
```

This creates `outputs/ndjar-mvp-presentacao-offline-arm64.apk`. Use it for colleague demos on recent Android phones. It embeds `assets/index.android.bundle`, disables the development server path and avoids the Metro error shown by normal debug builds.

Do not use `assembleDebug` output directly for field demos. A normal debug APK tries to connect to Metro at port `8081` and fails on a phone that is not connected to the development machine. For Play Store or a production pilot, use an EAS or CI signed release build with a real keystore, not this presentation APK.

Web/admin Playwright smoke check:

```bash
node tools/playwright-smoke.cjs
```

The current local audit captures are saved under `audit/mobile-current/` and `audit/playwright/`. They are evidence for local QA, not production assets.

The highest-risk tests protect:

- pH classification consistency.
- Source status preservation.
- Unsafe consultation escalation.
- Pilot fixture confidence.
- Database seed mapping.
- Mobile doctor safety.
- Design pH token alignment with domain rules.

## Security

Secret scanning is active through `detect-secrets` locally and in GitHub Actions. Do not add real credentials, fixed example passwords or generated JWT values to tracked files. GitGuardian remains an external independent check.

The trusted secret-scan workflow is designed to read its configuration from the protected base branch. Branch protection is an external repository setting and still needs to require that check and CODEOWNERS review. The pinned `pre-commit/action` has transitive dependencies that remain mutable at the provider layer. This is a recorded supply-chain concern; the workflow is not restructured here.

## Feature Troubleshooting

If the map is unavailable, show the region and community list. Do not invent GPS coordinates.

If a future native map closes the app, check the Android map provider configuration, API key, package name and offline fallback before using it in a presentation build. The current APK keeps the map as a pure React Native screen to stay stable during demos.

If internet is unavailable, show the local pilot snapshot and allow drafts where implemented.

If the assistant is uncertain, unsafe or missing a reviewed template, escalate to an agricultural doctor.

If a pH value is not validated, show its status as example, estimated or pending. Do not show it as a final recommendation.

If the web build changes generated Next files, keep generated files ignored and rerun the web checks.

If Expo reports dependency mismatch, run the Expo dependency check before debugging runtime issues.

## Future Development

- Durable offline storage with conflict handling.
- USSD short-code provider integration.
- SMS fallback.
- GPS-validated parcel mapping.
- Full GIS and PostGIS layers with 3D terrain or vector tile support through a development build.
- More regions beyond the southern pilot.
- Consultant response dashboard.
- Push notifications.
- Multilingual content in Portuguese, Crioulo, Fula and Balanta.
- Cooperative accounts.
- Field agent mode.
- Payment integration, including Orange Money if approved.
- Remotion videos for farmer education and onboarding.

## Accessibility

The product must not rely on colour alone. pH and source states need labels, numbers and status text.

Mobile touch targets should be at least 48 px on Android.

Forms need labels, helper text and clear errors.

Critical actions must remain visible on small Android screens.

Hover-only information is not acceptable for public web or admin.

## Deployment

Planned deployment targets:

- Mobile: Expo and EAS Android builds.
- Mobile presentation builds: `tools/build-mobile-presentation-apk.ps1` creates an offline APK for demos, signed with the debug key and limited to `arm64-v8a`.
- Web: Vercel or another Next.js-compatible host.
- API: Render, Fly.io, Railway, DigitalOcean or a VPS.
- Database: managed PostgreSQL with PostGIS.
- Storage: S3-compatible object storage for photos and library assets.

No external production account should be created without explicit permission.

Before a real pilot, create a production Android keystore, move builds to EAS or CI, generate an AAB for Play Store distribution and test installation on at least two physical Android phones.

## Credits

Project: N'djar.

Institutional base: ABIPTOM SARL.

Concept: agricultural aptitude, soil pH, mobile app, web platform and future USSD access for farmers in Guinea-Bissau.

Design reference: local `ndjar_app_prototipos_frontend.png`.

Source material: local N'djar diagnosis reports, pitch material, agricultural calendar notes and product documents. Private legal, banking, identity and passport documents must not be committed.

## Code

Shared agronomic rules live in packages, not screens.

Mobile and web should consume typed shared data.

Backend routes validate inputs and should keep the assistant deterministic until reviewed content and consultant workflows mature.

Admin changes to agricultural data must be auditable in future work.

## Storage

Future storage needs:

- Soil sample photos.
- Farmer parcel photos.
- Consultant profile photos.
- Library PDFs and images.
- Map assets.
- Generated education videos.

Private documents and legal records must stay outside the repository.

## Database

The database package uses Drizzle schema definitions for PostgreSQL and PostGIS-ready geometry columns.

Core model groups:

- Users and roles.
- Regions, communities and community groups.
- Crops, crop presence and crop evidence.
- Soil samples and pH source status.
- Calendar tasks.
- Consultations and consultation responses.
- Reviewed answer templates.
- Notification jobs.
- USSD sessions for phase 2.

The current seed maps the southern pilot fixtures and deliberately leaves geometry fields nullable because validated coordinates are not available yet.

## Languages and Technologies Used

Implemented:

- TypeScript.
- Playwright.
- pnpm workspaces.
- Turborepo.
- Expo.
- React Native.
- React Native Maps.
- Expo Vector Icons.
- Next.js.
- NestJS.
- Drizzle ORM.
- PostgreSQL and PostGIS-ready schema.
- Zod.
- Vitest.
- Prettier.

Planned or prepared:

- Redis and BullMQ for jobs.
- MapLibre for future real map layers.
- Expo SQLite for durable offline storage.
- TanStack Query and Zustand for richer client state.
- React Hook Form for production forms.
- Remotion for education videos.
