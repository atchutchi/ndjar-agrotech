# N'djar MVP Design Spec

## Purpose

Build a functional N'djar MVP that starts with Android, uses the southern pilot data, and prepares the platform for web admin, AI-assisted consultations, maps, offline use and future USSD access.

## Approved Direction

The approved direction is React Native with Expo for Android, Next.js for web and admin, and a common backend with PostgreSQL and PostGIS.

## Product Scope

The MVP focuses on a digital app first. USSD and short-code integration remain phase 2, but the data model must be ready for USSD sessions and menu flows.

The first geographic scope is the southern pilot documented in the reports, especially Quinara, Buba, Sare Donha 1, Sare Donha 2, Uane and Ugui. Other regions stay in future development.

The prototype must follow the provided mobile reference with 24 screens and improve it where operational risk is high.

## Users

Primary users are farmers and field users who need simple agricultural guidance.

Secondary users are agricultural doctors, consultants and technicians who validate or answer requests.

Admin users manage regions, crops, pH ranges, library content, consultation queues, forum moderation and future USSD content.

Public visitors use the web portal to understand the project, services and contact routes.

## MVP Modules

The mobile MVP includes onboarding, language, login, registration, home, map, region detail, crops, crop detail, calendar, soil sample drafts, agricultural doctors, consultation request, controlled AI assistant, forum, library, contact and profile.

The web MVP includes a public portal and later an admin panel.

The backend MVP includes auth, regions, communities, crops, recommendations, library resources, consultations, AI answer templates and sample drafts.

## Data Rules

Agronomic guidance must always expose status. Accepted statuses are example, estimated, field-observed, self-reported, lab-validated and consultant-reviewed.

The app must not present sample prototype pH values as final production data.

Each recommendation must have source, region, date and confidence.

Each pH result must store method when known. pH in water and pH in calcium chloride can differ.

AI answers must be retrieved from reviewed content first. If confidence is low or topic is risky, the request must be escalated to an agricultural doctor.

## UX Rules

The UI uses the N'djar green agricultural palette with clear white cards, dark green headings, high contrast text and orange or red warnings for risk.

Bottom navigation has no more than five main tabs: Home, Map, Doctor, Forum and Profile.

Offline state is visible and useful. Users can read saved content and create drafts without internet.

The map must have a list fallback for low-end phones, slow networks or missing map tiles.

## Technical Architecture

The repository will be a TypeScript monorepo.

Apps:

- `apps/mobile` for Expo Android.
- `apps/web` for Next.js public site and admin.
- `apps/api` for the backend.

Packages:

- `packages/domain` for shared agricultural types and rules.
- `packages/database` for schema, migrations and seed data.
- `packages/design-system` for tokens.
- `packages/ui` for shared web components where useful.
- `packages/fixtures` for safe pilot data.
- `packages/config` for shared tooling.

## Backend Choice

The backend recommendation is NestJS with TypeScript. The project needs clear modules for consultations, consultant assignment, notifications, future USSD, admin, audit logs and background jobs. NestJS gives stronger structure for this growth while keeping the MVP as one backend application.

Database access should use Drizzle or Kysely. PostGIS queries and future reporting will need SQL control. The MVP starts with Drizzle unless the implementation finds that Kysely gives cleaner geospatial query handling.

## Maps

Use MapLibre where possible. Start with simple pilot polygons or region centroids. Add precise GPS and full GIS layers later.

The first map does not claim parcel-level precision.

## Consultation Flow

A farmer asks a question.

The assistant searches reviewed predefined answers.

If a safe answer exists, the app shows it with source and confidence.

If no safe answer exists, a consultation ticket is created.

Consultants see pending tickets and must respond within 24 hours.

Admin can review repeated questions and convert approved answers into templates.

## Offline Strategy

Mobile stores library content, pilot region data, crop data, calendar data and sample drafts locally.

When online returns, the app syncs drafts and pulls updated content.

Conflict rules prefer server data for validated agronomic content and local data for unsent drafts.

## Non-goals For MVP

The MVP will not include live USSD, live Orange Money, parcel-level GPS precision, full national map coverage, automated agronomic diagnosis without human review or open unmoderated forum answers.

## Risks

The biggest risk is unsafe agronomic recommendation.

The second risk is promising offline and not delivering it.

The third risk is building a large super app before validating the core pilot workflow.

## Acceptance Criteria

The MVP is acceptable when a farmer can open the Android app, choose the pilot area, view pH context with confidence status, view observed or recommended crops, read the calendar, save a sample draft, ask a question, receive a safe predefined answer or escalation, and read key library content offline.
