# Optional campaign tiers

The Faixas selector contains exactly `Faixa única` and `Faixas 1, 2 e 3`. Numbered campaigns may contain any one, two or three filled tiers, including gaps. Entirely blank rows are omitted; a started tier requires both its quantity minimum and the active unit-price or percentage condition. At least one complete tier is required. Help text explains that unused tiers may remain blank.

Recognized numbered labels survive normalization, calculation, saved order snapshots and campaign editing. Legacy campaigns retain their labels and conditions. Editing a numbered campaign with one or two tiers opens the three-row option with unused rows blank. Toggling the selector preserves the first tier's entered values. Increasing minimums, nonincreasing prices, nondecreasing percentages, exact-cent calculations and historical sales checks remain enforced.

No schema migration or customer-data rewrite is required: the existing commerce validator supports one to three tier objects and stored labels. Isolated Postgres fixtures exercise a lone tier 2 and tiers 1/3 through campaign and sale validation. The pending CEP/manual-pin request is excluded.

Release validation and artifact identifiers will be recorded after CI and public verification.
