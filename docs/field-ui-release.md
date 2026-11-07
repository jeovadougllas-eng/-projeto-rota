# RotaMapa 1.3.0 — Foco em campo

The six main destinations implement approved mockup option 3 with the existing RotaMapa logo, scenic source files, petrol/teal/lime palette and a corresponding light theme. Responsive layouts preserve the user's saved theme and the installed iPhone safe-area boundary.

- **Dashboard:** compact current-portfolio switch, a prominent next route action, actual portfolio counters, a readable saved-point notice, three quick shortcuts and the existing appointment summary. Portfolio management and archived versions remain accessible.
- **Clients:** legal name followed by CNPJ, responsive cards, larger selection labels, visible location badges, name/CNPJ search and city/neighborhood/location controls. Category and clear filters live in “Mais filtros”. Full client details and edit handlers are retained.
- **Map and routes:** priority controls immediately precede their result disclosure. Search and bulk selection are inside the result list. The live map has a compact layer/GPS toolbar, existing pin adjustment and single-client navigation, route suggestion and saved-route access. Origin, strategies, review and advanced planning remain available in disclosures. Portrait uses a map-first layout; desktop landscape places the map beside planning.
- **Appointments:** the list is the initial view, with a day strip and a timeline showing saved times. Creation, individual hours, reminders, urgency, day-route selection and the original optimized route logic remain available. Secondary edit/delete actions are under each visit's options.
- **History:** four existing actionable visit metrics lead the page. Daily bars use the existing visit report's actual counts; sales and visit accounting are unchanged. The current calculator, Excel export, goals, projections, billing, buyer ranking and route history remain accessible.
- **Import:** an accessible upload label uses the original file input and parser. An optional name fills the existing portfolio confirmation; nothing is imported without the existing confirmation. Portfolio updates, synchronization, backup, catalog and campaigns remain accessible.

No database migration, auth change, new subscription rule or customer-data migration is involved. The presentation adapter moves existing controls with their handlers and IDs. No sample customer, appointment or sale data is added to production.

## Validation

100 browser cases passed across Android/desktop Chromium and iPhone WebKit (normal, small and landscape). The 51 workflow cases cover route geometry and origins, pending coordinates, GPS rejection for navigation, offline pin persistence, account/portfolio isolation, named imports, appointments, reminders, visit detail/sales linkage and plan restrictions. Intentional navigation changes are reflected explicitly in test steps. The three initially failing workflow assertions were corrected for the new layout/action context and passed focused reruns. An additional eight Chromium and four WebKit checks verified the final filter/layout refinements. A live OpenFreeMap style loaded successfully with a focused customer using a synthetic browser account.

Syntax/integration checks pass. Original scenic and brand files are byte-for-byte unchanged. The Android bundle is verified against every listed file hash and contains both new presentation assets in native HTML. Package, runtime, native version, signing and existing installers remain unchanged; delivery uses the compatible in-app update.

Appointment bell urgency keeps yellow/orange/red treatments in the compact header. Priority filter state changes do not animate through intermediate text/background combinations with insufficient contrast; the selected state updates immediately. Focused header-urgency and theme/selection checks pass on both Chromium profiles.

Browser fixtures use synthetic accounts and intercepted writes. No real customer records were modified during verification. Physical iPhone or Android devices were not available for automated testing. Published verification details are recorded separately after deployment.
