# Southern Pilot Source Notes

## Pilot Scope

The MVP starts with a controlled southern pilot:

- Region: Quinara.
- Sector: Buba.
- Communities: Sare Donha 1, Sare Donha 2, Uane and Ugui.

This scope is supported by the participatory diagnosis material and should be used before expanding to other regions.

## Field Observations

Sare Donha 1 and 2 are described with 32 hectares, divided into 2 hectare parcels.

Observed crops in Sare Donha include arroz, abobora, inhame, mandioca, milho, feijao, candja and badjiqui.

Uane and Ugui are described with 48 hectares, also divided into 2 hectare parcels.

Observed crops in Uane and Ugui include inhame, mandioca, milho, feijao and batata-doce.

The diagnosis says the production is organic and uses no chemicals.

One concrete issue appears in the diagnosis: mandioca in one Sare Donha parcel no longer produces as it did before.

The diagnosis mentions more than 20 bags of 200 kg of mandioca per year for sale and local consumption. Other crops are not quantified.

## Recommended MVP Data Status

Use these source statuses:

- `example` for prototype-only values.
- `estimated` for values inferred from documents without lab proof.
- `field_observed` for diagnosis observations.
- `self_reported` for producer-reported production, area or history.
- `lab_validated` for future laboratory pH results.
- `consultant_reviewed` for recommendations reviewed by an agricultural doctor.

## pH Rules

Educational content can explain that pH 7 is neutral, below 5.6 is acidic, above 7 is alkaline, and 5.6 to 6.5 is generally favourable for nutrient availability.

The app must not turn this into crop-specific recommendation without validated source, region, crop and method.

The pH method must be stored. pH in water and pH in calcium chloride can differ.

## Calendar Rules

The existing calendar structure is useful for UX and initial content:

- Rainy months.
- Dry months.
- Soil preparation.
- Planting.
- Weeding.
- Harvest.
- Threshing.

Calendar content must be marked as pilot or estimated until validated by crop and zone.

## Data Risks

Do not reduce agricultural aptitude to pH only.

Agricultural aptitude can depend on drainage, salinity, texture, fertility, organic matter, soil depth, water access, rain timing and pest pressure.

Do not show pH as final when sample ID, date, coordinates, depth, method, lab and responsible technician are missing.

Do not allow AI or forum replies to provide unsafe agricultural advice without reviewed content or human escalation.

