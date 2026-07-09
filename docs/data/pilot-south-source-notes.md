# Southern Pilot Source Notes

## Source Scope

These fixtures are derived from local project material already mapped in the repository:

1. Participatory diagnosis material for the southern pilot.
2. Agricultural calendar spreadsheets used as early content structure.

The notes below avoid naming reports that are not explicitly identified in the repository. They also avoid copying private source text. The goal is to make each fixture transformation auditable without exposing private documents.

## Traceability Table

| Fixture | Local evidence available | Transformation made | Source status in fixture | Caution |
| --- | --- | --- | --- | --- |
| `packages/fixtures/src/pilot-south.ts` region scope | The local material identifies Quinara, Buba, Sare Donha 1, Sare Donha 2, Uane and Ugui as the southern pilot scope. | Stored as one pilot region with four community records. | Region and community scope use `field_observed`. | This only confirms the pilot scope. It does not validate all agronomic values per community. |
| `packages/fixtures/src/pilot-south.ts` area groups | The local material supports grouped area totals: Sare Donha 1 and Sare Donha 2 together represent 32 hectares, and Uane and Ugui together represent 48 hectares. Both groups use 2 hectare parcels. | Stored as `communityAreaGroups` with grouped totals. The per-community `areaHectares` values are balanced splits of those grouped totals. | Group totals use `field_observed`. Per-community `areaHectaresSourceStatus` uses `estimated`. | Do not present the 16 hectare or 24 hectare community values as field observations. They are inferred from grouped totals. |
| `packages/fixtures/src/pilot-south.ts` production model | The local material records organic production and no reported chemical use. | Stored on each community as `productionMode: "organic"` and `chemicalUse: "none_reported"`. | Stored as part of the community fixture with `field_observed` scope. | This does not prove absence of every input. It only records that no chemical use is reported in the local material. |
| `packages/fixtures/src/pilot-south.ts` pH example | No validated sample ID, date, coordinates, depth, method, laboratory or technician metadata is available in the fixture source. | Kept only as a synthetic pH example to exercise the domain type path. The ID and collected date text are explicitly synthetic. | `status: "example"` and `method: "unknown"`. | Do not treat this as a real soil sample or as agronomic advice. |
| `packages/fixtures/src/crops.ts` Sare Donha crops | The local material supports crop presence for the grouped Sare Donha pair: arroz, abobora, inhame, mandioca, milho, feijao, candja and badjiqui. | Stored as `presenceByCommunityGroup` for the pair. `presenceByCommunity` is an estimated expansion for consumers that need community-level rows. | Group presence uses `field_observed`. Individual community presence uses `estimated`. | Do not claim that each individual Sare Donha community has separately observed crop presence unless a more specific source is added. |
| `packages/fixtures/src/crops.ts` Uane and Ugui crops | The local material supports crop presence for the grouped Uane and Ugui pair: inhame, mandioca, milho, feijao and batata-doce. | Stored as `presenceByCommunityGroup` for the pair. `presenceByCommunity` is an estimated expansion for consumers that need community-level rows. | Group presence uses `field_observed`. Individual community presence uses `estimated`. | Do not claim that each individual Uane or Ugui record is separately observed unless a more specific source is added. |
| `packages/fixtures/src/crops.ts` mandioca production | The local material includes a self-reported mandioca production quantity of more than 20 bags of 200 kg per year for sale and local consumption. | Stored as production evidence on mandioca with the minimum bag count, bag weight and use cases. | `self_reported`. | This is not lab validated and is not a measured yield estimate. |
| `packages/fixtures/src/crops.ts` mandioca agronomic note | The local material notes that one Sare Donha parcel no longer yields mandioca as it previously did. | Stored as an agronomic note tied to `sare-donha-1`, matching the current fixture granularity. | `field_observed`. | The fixture does not prove that the issue affects every Sare Donha parcel. |
| `packages/fixtures/src/calendar.ts` pilot calendar | The local calendar structure supports a September to August cycle and broad task sequencing. | Stored as monthly preparation, planting, weeding, harvest and threshing tasks. | `estimated`. | The calendar is not crop-specific or zone-specific validation. |

## Source Status Rules

Use these statuses consistently:

- `field_observed` for observations supported at the same granularity as the fixture field.
- `self_reported` for producer-reported production quantities or history.
- `estimated` for inferred values, balanced splits, placeholder agronomic values or expanded rows without direct per-row evidence.
- `example` only for prototype-only content not grounded in validated source material.
- `lab_validated` only when a real sample, method and laboratory result exist.
- `consultant_reviewed` only when an agricultural specialist has reviewed the content.

## Data Risks

Do not reduce agricultural aptitude to pH only.

Agricultural aptitude also depends on drainage, salinity, texture, fertility, organic matter, soil depth, water access, rain timing and pest pressure.

Do not present pH as final when sample ID, date, coordinates, depth, method, laboratory and responsible technician are missing.

Do not present inferred community-level area or crop presence as observed when the evidence is grouped by community pair.

Do not let AI or forum content give unsafe agronomic advice without reviewed content or human escalation.
