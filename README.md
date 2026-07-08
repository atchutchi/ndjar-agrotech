# N'djar Agrotech

N'djar is a mobile-first agricultural decision platform for Guinea-Bissau. The first MVP focuses on Android and the southern pilot area documented in the project reports, especially Quinara, Buba, Sare Donha, Uane and Ugui. The web version will follow as a public portal and admin panel.

The product helps farmers, field teams and agricultural consultants understand soil pH, choose suitable crops, follow agricultural calendars, request support from agricultural doctors and access validated farming information. USSD and short-code access are planned for phase 2 so the service can also support farmers with weak internet access.

## Table of Contents

1. [Overview](#overview)
2. [Strategy](#strategy)
3. [User Stories](#user-stories)
4. [Skeleton](#skeleton)
5. [Features](#features)
6. [SEO](#seo)
7. [Wireframes](#wireframes)
8. [Testing](#testing)
9. [Feature Troubleshooting](#feature-troubleshooting)
10. [Future Development](#future-development)
11. [Accessibility](#accessibility)
12. [Deployment](#deployment)
13. [Credits](#credits)
14. [Code](#code)
15. [Storage](#storage)
16. [Database](#database)
17. [Languages and Technologies Used](#languages-and-technologies-used)

## Overview

The first functional prototype will reproduce the pitch and mobile prototype flow shown in `ndjar_app_prototipos_frontend.png`.

The MVP will include:

- Android app first.
- Web admin and public website second.
- Southern pilot data first.
- Interactive map with regional selection.
- Soil pH guidance with clear validation status.
- Crop recommendations by region.
- Agricultural calendar.
- Soil sample registration.
- Agricultural doctor consultations.
- Controlled AI assistant with predefined and reviewed answers.
- Consultant escalation when the assistant cannot answer safely.
- Offline-first content and draft storage.
- USSD-ready architecture for phase 2.

## Strategy

The strategy is to build a useful MVP before building a large platform.

Phase 1 is digital and mobile-first. It validates the user journey, the data model and the consultation workflow. It must work on Android, with offline content and local drafts.

Phase 2 adds USSD and short-code access. The backend must be prepared for it from the start, but the MVP will not depend on live USSD integration.

Phase 3 adds stronger GIS precision, GPS validation, more regions, consultant operations and production-grade payments.

The main product risk is agronomic accuracy. The app must never present estimated pH or sample data as final truth. Each recommendation needs source, date, status and confidence.

## User Stories

### Farmer

As a farmer in Quinara, I want to select my community and see the known pH range so that I understand whether my soil is acidic, reasonable or suitable for common crops.

As a farmer with poor internet, I want to read saved guides and agricultural calendar tasks offline so that I can continue working without mobile data.

As a farmer with a crop problem, I want to ask a simple question and receive a safe first answer so that I know what to do next.

As a farmer whose question is complex, I want my request to be sent to an agricultural doctor so that I receive a technical opinion within 24 hours.

As a farmer collecting a soil sample, I want to register the parcel, community, crop and photo so that the sample can later be validated by a technician.

### Agricultural Doctor

As an agricultural consultant, I want to see pending questions grouped by crop, region and urgency so that I can respond within 24 hours.

As an agricultural consultant, I want to approve or correct AI suggested answers so that farmers receive safe guidance.

As an agricultural consultant, I want to see sample history before giving a recommendation so that I do not answer without context.

### Admin

As an admin, I want to manage regions, communities, crops, pH ranges and sources so that the app uses controlled data.

As an admin, I want to moderate forum content so that wrong agricultural advice does not spread.

As an admin, I want to publish library content by language and offline availability so that the mobile app can sync useful information.

### Public Website Visitor

As a partner or funder, I want to understand the N'djar mission, pilot area, services and impact so that I can assess collaboration.

As a cooperative, I want to contact N'djar and request support so that my members can access agricultural information.

## Skeleton

Recommended monorepo:

```text
ndjar-agrotech/
  apps/
    mobile/
    web/
    api/
  packages/
    config/
    database/
    design-system/
    domain/
    fixtures/
    ui/
  docs/
    product/
    design/
    data/
    operations/
    superpowers/
  scripts/
```

The skeleton separates mobile, web, API, shared domain logic, design tokens, database schema and pilot fixtures.

## Features

### MVP Features

- Onboarding.
- Language selection.
- Login and registration by phone.
- Home dashboard.
- Pilot map for southern Guinea-Bissau.
- Region detail with pH status.
- Crop list and crop detail.
- Agricultural calendar.
- Soil sample draft registration.
- Agricultural doctor directory.
- Consultation request.
- Controlled AI assistant for predefined questions.
- Escalation to consultant.
- Forum read and draft question flow.
- Offline library.
- Profile and sync state.

### Web Features

- Public landing page.
- Project overview.
- Services.
- Pilot data explanation.
- Contact.
- Admin login.
- Region and crop management.
- Library management.
- Consultation queue.
- Forum moderation.

## SEO

Initial SEO focus for the public web version:

- Agricultural support in Guinea-Bissau.
- Soil pH and crop suitability.
- Agricultural calendar Guinea-Bissau.
- N'djar agricultural doctor.
- Digital agriculture for farmers.
- USSD agriculture information Guinea-Bissau.

Each public page must include a clear title, description, Open Graph metadata, structured headings and human-readable URLs.

## Wireframes

The mobile wireframes follow the provided 24-screen prototype:

1. Splash.
2. Onboarding.
3. Language and access mode.
4. Login.
5. Registration.
6. Home.
7. Agricultural map.
8. Region detail.
9. Crop list.
10. Crop detail.
11. Calendar.
12. Soil sample.
13. Livestock.
14. Agricultural doctors.
15. Doctor profile.
16. Appointment booking.
17. Chat.
18. Forum.
19. Discussion.
20. New question.
21. Library.
22. Subscription.
23. Contact.
24. Profile.

The web wireframes will not copy the phone UI. The web will use a public landing page and an admin panel with dense management views.

## Testing

Testing will cover:

- Unit tests for domain rules.
- Database schema tests.
- API tests.
- React Native component tests.
- Offline sync tests.
- Map interaction tests.
- Accessibility tests.
- End-to-end tests for critical user journeys.
- Seed data validation for pilot content.

The first test priority is not visual perfection. The first priority is preventing unsafe recommendations and broken offline flows.

## Feature Troubleshooting

If the map does not load, the app must show the list of regions and pH ranges as fallback.

If internet is unavailable, the app must show saved library content and allow sample drafts.

If the AI assistant is uncertain, it must escalate to an agricultural doctor.

If no consultant is available, the user must see a clear 24-hour response expectation.

If a pH value is not validated, the UI must show estimated or pending status.

If a payment integration is unavailable, the MVP must keep consultation requests in a manual review state.

## Future Development

- USSD short-code integration.
- Orange Money payments.
- GPS-validated parcel mapping.
- Full GIS and PostGIS layers.
- More regions beyond the southern pilot.
- Consultant response dashboard.
- Push notifications.
- SMS fallback.
- Multilingual content in Portuguese, Crioulo, Fula and Balanta.
- Cooperative accounts.
- Field agent mode.
- Advanced recommendation engine.
- Remotion videos for farmer education and onboarding content.

## Accessibility

The app must not rely only on colour for pH states. It must show text labels such as ideal, reasonable, acidic, pending and validated.

Touch targets must be at least 44 px.

Body text must remain readable on low-cost Android phones.

Forms must have labels, helper text and clear error messages.

The app must support reduced motion and screen reader labels.

## Deployment

Target deployment:

- Mobile app: Expo EAS for Android builds.
- Web: Vercel or another Next.js-compatible host.
- API: Render, Fly.io, Railway, DigitalOcean or a VPS, depending on cost and data needs.
- Database: managed PostgreSQL with PostGIS.
- Storage: S3-compatible object storage for images and sample photos.

No external production accounts should be created without explicit permission.

## Credits

Project: N'djar.

Institutional base: ABIPTOM SARL.

Concept: agricultural aptitude, soil pH, mobile app, web platform and future USSD access for farmers in Guinea-Bissau.

Design reference: `ndjar_app_prototipos_frontend.png`.

Source material: local N'djar documents, pitch decks, diagnosis reports, calendar sheets and company files.

## Code

Code must be organised by responsibility. Shared agricultural rules must live in packages, not inside screens.

Mobile screens should consume typed domain data.

Backend routes should validate all inputs.

Admin changes to agricultural data must be auditable.

## Storage

Storage will be needed for:

- Soil sample photos.
- Farmer parcel photos.
- Consultant profile photos.
- Library PDFs and images.
- Map assets.
- Generated educational videos.

Private documents and legal records must not be committed to the public repository.

## Database

The database will use PostgreSQL with PostGIS.

Core entities:

- Users.
- Farmer profiles.
- Consultants.
- Regions.
- Communities.
- Parcels.
- Soil samples.
- pH results.
- Crops.
- Crop recommendations.
- Calendar tasks.
- Library resources.
- Forum questions.
- Forum replies.
- Consultations.
- AI answers.
- Consultant reviews.
- Subscriptions.
- Payments.
- USSD sessions for phase 2.

## Languages and Technologies Used

Planned stack:

- TypeScript.
- React Native.
- Expo.
- Next.js.
- NestJS.
- PostgreSQL.
- PostGIS.
- Drizzle or Kysely.
- TanStack Query.
- Zustand.
- React Hook Form.
- Zod.
- MapLibre.
- Expo SQLite.
- Remotion for future educational content.

## Current Status

Planning and repository foundation are in progress.

See:

- `docs/superpowers/specs/2026-07-08-ndjar-mvp-design.md`
- `docs/superpowers/plans/2026-07-08-ndjar-mvp-foundation.md`
