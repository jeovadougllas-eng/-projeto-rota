# Import menu and sidebar icons — 2026-10-29

Published at https://traxio-preview.vercel.app/ from commit `110ba6a8dd19594fdbb3f418be062119db6393aa` (deployment `dpl_92onmbhRpq3D6uENWS2LweQouKcz`).

The sidebar and page now say **Importar carteira**, with an upload icon. All five sidebar symbols use the existing inline SVG shapes with rounded, 2.2-unit strokes, so the outline weight stays consistent in WebKit and Chromium. Import handlers, customer storage, account identifiers, backgrounds and approved branding are unchanged.

Verification:

- `npm run check` and `node scripts/check-rotamapa-art.mjs` passed.
- [Release run 40971575513](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40971575513): 18 interface checks passed, including four iPhone WebKit profiles; Android compilation and all 92 bundled-file hashes passed.
- Six local interface checks passed after updating icon comparisons to inspect the SVG elements. Public browser checks verified all five stroke weights, the renamed menu/title, the spreadsheet file picker and page width at 390px and 1440px. Account and external-service fixtures were used; no real customer records were changed.
- Downloaded public APK and update ZIP hashes match their published manifests. Public HTML and presentation assets match the release source.

Android web update: `1f58d3f569637396c7ff51340a68f94754e3653cf15bce02642b09499ae932f5`; runtime `capacitor8-20261026`, native compatibility version 2.

APK SHA-256: `ea0640b0b8fb8181c4347de2eeaec6c50f22fdb2ef412ba1967a917e9e7dd139`; 17162867 bytes. This APK is for first installations; existing compatible installations receive the web update. The original `traxio-android-testes.apk` remains unchanged. No physical iPhone or installed-emulator test was performed for this visual release.
