# Database Model

The database foundation targets PostgreSQL with Drizzle ORM and PostGIS-ready geometry columns.

No production database connection is required for this task. The schema and seed records are typed so a future migration can insert the southern pilot fixtures without changing the fixture source contracts.

## Source Status Rules

The schema uses the shared `AgronomicSourceStatus` values from `@ndjar/domain`:

- `field_observed` for evidence recorded at the same granularity as the stored row.
- `estimated` for inferred values, balanced splits and expanded community-level rows.
- `example` for prototype-only values that must not be treated as measured observations.
- `self_reported` for producer-reported production quantities or history.
- `lab_validated` for future validated soil or agronomic tests.
- `consultant_reviewed` for future agricultural doctor reviewed recommendations.

Sensitive agronomic rows keep their own `sourceStatus` instead of inheriting status from a parent table. This applies to areas, crop presence, soil samples, calendar tasks, answer templates and consultation responses.

## Core Tables

`users` stores farmer, agricultural doctor and admin identities. Phone numbers are represented by nullable hash fields so the model does not require private contact data in seed records.

`regions`, `community_groups`, `communities` and `community_group_members` model pilot geography. Regions and communities have nullable PostGIS `Point` and `MultiPolygon` columns, while community groups have nullable `Polygon` geometry. The current seed does not include coordinates because the fixtures do not contain validated coordinates.

`crops`, `crop_presence_group_observations` and `crop_presence` keep group-level evidence separate from estimated per-community expansions. This prevents grouped field observations from being presented as individual community observations.

`crop_production_evidence` and `crop_agronomic_notes` preserve self-reported production evidence and field-observed notes from the fixtures.

`soil_samples` supports pH, pH class, method, collection text, depth and nullable PostGIS point location. The current synthetic pH fixture is stored with `sourceStatus: "example"`.

`calendar_tasks` stores monthly pilot tasks with region and crop fields nullable. The current fixture is broad pilot guidance, not crop-specific validation.

## Consultations and Deterministic Answers

`answer_templates` stores reviewed predefined responses for the deterministic answer robot. It includes trigger terms, language, deterministic priority, review metadata and `sourceStatus`.

`consultations` stores the farmer question, channel, crop and location context, matched risk terms, selected template and escalation fields. `escalationDueAt` supports the 24 hour Médico Agrícola service level without implementing the worker yet.

`consultation_responses` stores the actual answer or recommendation returned to the user. It keeps `sourceStatus`, so deterministic template answers and doctor responses can be audited independently.

`notification_jobs` stores future delivery work, including doctor escalation notifications, consultation replies, offline sync reminders and USSD follow-ups.

`ussd_sessions` stores phase 2 session state with route, current screen, depth and lifecycle status. It is intentionally integration-neutral.

## Offline Sync

Mutable or client-facing tables include nullable offline sync fields:

- `offlineClientId`
- `offlineDeviceId`
- `localRevision`
- `lastSyncedAt`
- `syncVersion`
- `deletedAt`

These fields support mobile-first operation and future conflict resolution without requiring the offline engine in this task.

## Seed Coverage

`packages/database/src/seed.ts` maps:

- `pilotSouthRegions` to regions, communities, community groups, group members and soil samples.
- `pilotCrops` to crops, group observations, estimated community presence, production evidence and agronomic notes.
- `pilotCalendarTasks` to region-scoped calendar tasks.

The seed deliberately leaves geometry fields null. Adding coordinates later should require source notes and appropriate `sourceStatus` values.
