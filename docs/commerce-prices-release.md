# Exact unit prices and table-price items

Published at https://traxio-preview.vercel.app/ from `16d29e519dd46c28849fc661fc71a7a15e2b4529`, deployment `dpl_7zdQYQMHLv8tGeLRfTu3Bfk68EVW` (READY).

With no campaign, a valid product/quantity enables Add to order immediately, including after a discounted line. The handler recalculates the table-priced line on click. Explicit table-price preview remains available. Invalid quantities and duplicate presentations retain the existing checks.

Campaign conditions now default to exact unit price at the minimum quantity; percentage discount remains the second mode. Only the active field is enabled/required. Existing percentage campaigns open in their saved mode. Each campaign uses one mode across its quantity tiers. Thresholds increase and effective prices cannot rise or exceed table price. The highest reached tier applies to every unit; below the first threshold the current table price remains. Exact prices are integer cents, not reconstructed from rounded percentages. The equivalent percentage is only informational. Existing sales retain their snapshots.

The additive migration `20261030024431_campaign_unit_prices.sql` replaces the existing invoker trigger validator and retains restricted privileges. Both table and campaign references are scoped to the loaded portfolio. It validates exact prices, equivalent basis points, minimum tiers, immutable sales and line/order totals. No catalog/customer/historical-sale rows were rewritten. Supabase local/production validator hashes match: `20fd2f229630a004ff3f35facc08d279`. Post-migration read-only checks confirmed unit-price support, portfolio checks and no anonymous execution. Security advisors showed only the unchanged pre-existing password-protection advisory.

A Safari regression was corrected by preserving the calculate button's text node when its label has not changed; rebuilding it during quantity blur swallowed taps in WebKit.

Verification:

- [Run 40994269321](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40994269321): 106 unit checks; 60 browser checks across six profiles; isolated Postgres legacy percentage, exact-price, tamper, owner and portfolio assertions; native compilation and all 95 bundled-file hashes passed.
- Tested 5 units at table R$ 9.00; 6 at exact R$ 8.56 = R$ 51.36; higher reached tiers; large integer prices that cannot be represented by two-decimal percentages; invalid/increasing/above-table prices; offline ledger and historical snapshots.
- Public browser smoke used account/cloud fixtures: 6 × R$ 8.56 plus a directly added 4 × R$ 10.28 yielded R$ 92.48 and synchronized correctly. No actual user/customer/order records were created by browser tests.
- Public source assets, downloaded APK and update ZIP match their release manifests and local expected hashes. Scenic assets, branding, native identifiers and original installer are unchanged. No physical-phone/emulator installation was performed for this release.

Android update: `0dfb548263bef894f20172b30f3d7ffd3f44b2f4719b91339f2c3daabcc56487`; runtime `capacitor8-20261026`, compatibility version 2.
APK: 17177945 bytes; SHA-256 `6267a63963a95b68d976415d069de9085d8e6f043aa7bc2238cf8c20a78bccfd`.

The APK is for first installations; existing compatible installations receive the internal web update.
