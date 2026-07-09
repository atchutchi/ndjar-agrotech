# N'djar Agrotech

N'djar is a mobile-first agricultural decision platform for Guinea-Bissau. The current MVP foundation focuses first on Android, then web and admin. The first pilot area is the southern diagnosis scope around Quinara, Buba, Sare Donha 1, Sare Donha 2, Uane and Ugui.

The product helps farmers, field teams and agricultural consultants work with soil pH, crop observations, agricultural calendars, local knowledge, safe consultation triage and future USSD access. The assistant is intentionally deterministic in this foundation. It only returns predefined safe answers and escalates unsafe or unknown questions to an agricultural doctor workflow.

## Table of Contents

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Strategy](#strategy)
4. [User Stories](#user-stories)
5. [Skeleton](#skeleton)
6. [Features](#features)
7. [SEO](#seo)
8. [Wireframes](#wireframes)
9. [Testing](#testing)
10. [Feature Troubleshooting](#feature-troubleshooting)
11. [Future Development](#future-development)
12. [Accessibility](#accessibility)
13. [Deployment](#deployment)
14. [Credits](#credits)
15. [Code](#code)
16. [Storage](#storage)
17. [Database](#database)
18. [Languages and Technologies Used](#languages-and-technologies-used)

## Overview

The repository is now a TypeScript monorepo with shared packages and three application foundations:

- `apps/mobile`: Expo React Native Android-first app with bottom tabs, offline fixture snapshot and consultation triage.
- `apps/web`: Next.js public web and admin placeholder.
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
- Next.js public web page, admin placeholder and health route.
- Initial brand guide, wireframes and reusable design tokens.

Important limitations:

- No production database is connected yet.
- No real GPS or precise map geometry is committed.
- No live USSD short code is connected.
- No free-form AI advice is enabled.
- Mobile offline storage is an in-memory foundation for now, not durable device storage.
- Admin has no authentication and no write workflows yet.

## Strategy

Phase 1 is a digital MVP. It validates the Android journey, the shared data model, the safe consultation flow and the pilot content structure.

Phase 2 adds USSD and short-code access. The backend already models USSD sessions, but there is no telecom integration in this branch.

Phase 3 adds GPS validation, stronger GIS layers, more regions, consultant operations, durable offline sync, payments and production deployment.

The main product risk is agronomic accuracy. The app must not present estimated or example data as validated truth. Every sensitive row keeps a source status such as `field_observed`, `estimated`, `example`, `self_reported`, `lab_validated` or `consultant_reviewed`.

## User Stories

Farmer:

- As a farmer in Quinara, I want to see my pilot region, communities and pH context so that I understand the current information before asking for help.
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
- Home dashboard for the pilot.
- Map fallback view with regions and communities, without invented GPS precision.
- Doctor triage screen using local deterministic safety rules.
- Forum placeholder with cautious topics.
- Profile placeholder with sync and pilot context.
- API assistant route with 24-hour escalation.
- API offline sync route returning pilot fixture data.
- Web homepage for the N'djar MVP and pilot.
- Web admin placeholder for future management workflows.
- Database schema ready for PostGIS and future USSD sessions.
- Design tokens and brand guide.

Planned MVP features not complete yet:

- Login and registration by phone.
- Durable offline storage with Expo SQLite or equivalent.
- Real map layer with validated coordinates.
- Soil sample photo capture and upload.
- Consultant dashboard with assignments.
- Moderated forum workflows.
- Library downloads for offline reading.
- Subscription and payment workflows.

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
- `/admin`: admin placeholder for future operational modules.
- `/api/health`: web health route.

## Testing

Available commands:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Targeted checks:

```bash
pnpm --filter @ndjar/domain test
pnpm --filter @ndjar/fixtures test
pnpm --filter @ndjar/database test
pnpm --filter @ndjar/api test
pnpm --filter @ndjar/mobile test
pnpm --filter @ndjar/web test
pnpm --filter @ndjar/design-system test
```

Mobile Expo validation:

```bash
pnpm --filter @ndjar/mobile exec expo install --check
pnpm --filter @ndjar/mobile exec expo export --platform android --output-dir .expo-export-test --no-minify
```

The highest-risk tests protect:

- pH classification consistency.
- Source status preservation.
- Unsafe consultation escalation.
- Pilot fixture confidence.
- Database seed mapping.
- Mobile doctor safety.
- Design pH token alignment with domain rules.

## Feature Troubleshooting

If the map is unavailable, show the region and community list. Do not invent GPS coordinates.

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
- Full GIS and PostGIS layers.
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
- Web: Vercel or another Next.js-compatible host.
- API: Render, Fly.io, Railway, DigitalOcean or a VPS.
- Database: managed PostgreSQL with PostGIS.
- Storage: S3-compatible object storage for photos and library assets.

No external production account should be created without explicit permission.

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
- pnpm workspaces.
- Turborepo.
- Expo.
- React Native.
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
