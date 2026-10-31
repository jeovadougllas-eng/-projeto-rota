# CNPJ below the customer name and live search

Customer list entries show the CNPJ directly below the legal name, in the same family at a smaller size, in both themes. The shared read-only identity helper formats the document as `00.000.000/0000-00`, retains leading zeroes, reads imported/root/official fields, and displays `CNPJ não informado` for missing data. It never edits client records or guesses missing digits.

The registry, map, appointment and recommendation search inputs include the CNPJ, accepting partial digits and punctuation on each input event. Name/address/region searches and the existing filters/selection remain. Results use only the loaded account/portfolio; there is no external lookup or new customer cache. Labels also cover client details, focused-map actions, route stops, appointment entries, visit history and sales history. Historical visits use their own CNPJ snapshot when present and a live fallback only when absent.

No database, address/geolocation, brand or background changes are required. The pending CEP/manual-pin request remains excluded.

Published at https://traxio-preview.vercel.app/ from `b40b170195bd3934edf1ab985e68c9743bdbd567`; deployment `dpl_ksbxjUu6uBeZUjE4Vmss8rSZQLz1` READY. [CI run 41166841741](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/41166841741) passed: 115 unit checks; 30 CNPJ browser cases across six profiles; nine existing client-form/CEP/filter checks on Safari, Android and desktop; native compilation and all 102 bundled-file hashes. Tests use synthetic client identifiers.

The public browser verified immediate partial/formatted CNPJ filtering, smaller document text below the name in light/dark themes, the same identifier in the client detail and map list, no page errors and unchanged client storage. Downloaded public assets, APK and update ZIP match local source and manifests. No database migration or actual customer/account writes were performed. Approved scenic backgrounds and brand assets passed their original checks.

Compatible Android web update: `dbd60f54643b8a50f3eb9d8093ecfea36a0687e044aceeed21a3f33b9d8ff4be`, runtime `capacitor8-20261026`, native version 2. New-install APK: 17823249 bytes; SHA256 `7984415edac84e6592a0b6a51efd3e84f29963636d2d4f61a5bda18fab62dfd7`. Existing compatible installations receive the internal update, preserving their data. No physical-phone/emulator installation was performed for this release.
