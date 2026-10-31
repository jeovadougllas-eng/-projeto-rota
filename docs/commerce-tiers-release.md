# Optional campaign tiers

The Faixas selector contains exactly `Faixa única` and `Faixas 1, 2 e 3`. Numbered campaigns may contain any one, two or three filled tiers, including gaps. Entirely blank rows are omitted; a started tier requires both its quantity minimum and the active unit-price or percentage condition. At least one complete tier is required. Help text explains that unused tiers may remain blank.

Recognized numbered labels survive normalization, calculation, saved order snapshots and campaign editing. Legacy campaigns retain their labels and conditions. Editing a numbered campaign with one or two tiers opens the three-row option with unused rows blank. Toggling the selector preserves the first tier's entered values. Increasing minimums, nonincreasing prices, nondecreasing percentages, exact-cent calculations and historical sales checks remain enforced.

No schema migration or customer-data rewrite is required: the existing commerce validator supports one to three tier objects and stored labels. Isolated Postgres fixtures exercise a lone tier 2 and tiers 1/3 through campaign and sale validation. The pending CEP/manual-pin request is excluded.

Published at https://traxio-preview.vercel.app/ from `c9a255e4d4afadd7fc644179bec4cae63291bd04`; deployment `dpl_FNb1VZwGgqXoVXwkotr7zjLnQc5e` READY. [CI 40999348859](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40999348859) passed: 107 unit checks, 102 browser cases across six profiles, isolated Postgres fixtures and native compilation. Public fixture smoke saved/edited a lone tier 2 and a mixed exact-price/table order. Public assets, APK and all 95 native bundled files matched source and release manifests.

Android compatible web update: `6236ad6f924cb3b8a78ca0e6a0f62aa99bd466acd24e68835cfa779594c3d9bb` (runtime `capacitor8-20261026`, native version 2). New-install APK SHA256: `00cca8733489218a6912b7c065eb5daa6b81b0bd3c722152655480ea3a6a29fe`, 17178449 bytes. Existing compatible Android installations receive the internal web update without reinstalling.
