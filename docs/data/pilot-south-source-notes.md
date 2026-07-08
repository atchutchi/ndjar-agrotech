# Southern Pilot Source Notes

## Source Bundle

These fixtures are derived from two local source groups already mapped in the repository:

1. Participatory diagnosis reports for the southern pilot.
2. Agricultural calendar spreadsheets used as early content structure.

No legal, identity, banking or private household documents are used for these fixtures.

## Fixture Coverage

`packages/fixtures/src/pilot-south.ts`

This file covers the pilot scope for Quinara, Buba, Sare Donha 1, Sare Donha 2, Uane and Ugui.

The reports support a cautious split of the reported area into community records:

- Sare Donha 1 and Sare Donha 2 together represent 32 hectares with 2 hectare parcels.
- Uane and Ugui together represent 48 hectares with 2 hectare parcels.

Because the brief does not validate a per-community distribution beyond those grouped totals, the fixture stores a balanced split inside each grouped pair and treats the geographic scope itself as `field_observed`.

The production model is recorded as organic with no chemicals reported and stays at `field_observed`.

The pH fixture is intentionally not validated. It exists only to exercise the domain type path and to keep pH confidence visible in the app. The sample therefore uses `example` status and `unknown` method. It must not be interpreted as laboratory evidence.

`packages/fixtures/src/crops.ts`

Observed crops for Sare Donha 1 and 2 are arroz, abobora, inhame, mandioca, milho, feijao, candja and badjiqui.

Observed crops for Uane and Ugui are inhame, mandioca, milho, feijao and batata-doce.

Those crop presences are stored as `field_observed`.

The mandioca production note of more than 20 bags of 200 kg per year for sale and local consumption is stored as `self_reported` production evidence, not `lab_validated`.

The note that one Sare Donha parcel no longer yields mandioca as before is stored as `field_observed`.

`packages/fixtures/src/calendar.ts`

The calendar follows the required September to August cycle.

Its season and task sequencing comes from the existing pilot calendar structure:

- rainy months
- dry months
- preparation
- planting
- weeding
- harvest
- threshing

The fixture does not claim crop-specific or zone-specific validation. Every calendar entry therefore remains `estimated`.

## Source Status Rules

Use these statuses consistently:

- `field_observed` for participatory diagnosis observations
- `self_reported` for producer-reported production quantities or history
- `estimated` for inferred or placeholder agronomic values without sampling proof
- `example` only for prototype-only content not grounded in the pilot material
- `lab_validated` only when a real sample, method and laboratory result exist
- `consultant_reviewed` only when an agricultural specialist has reviewed the content

## Data Risks

Do not reduce agricultural aptitude to pH only.

Agricultural aptitude also depends on drainage, salinity, texture, fertility, organic matter, soil depth, water access, rain timing and pest pressure.

Do not present pH as final when sample ID, date, coordinates, depth, method, laboratory and responsible technician are missing.

Do not let AI or forum content give unsafe agronomic advice without reviewed content or human escalation.

