# Explicit manual invoicing compatibility

The buyer insights endpoint includes a manually entered sale in both rankings when its owner has explicitly confirmed invoicing. Saving an ordinary manual declaration is not an invoicing confirmation. PDF imports continue to use receipt-level invoicing and settled quantities, including confirmations made without an updated PDF.

Manual invoicing is recorded separately from the order status in `manualBilling`, with the authenticated owner, confirmation timestamp, reason, and original amount. The database validates ownership, the sum of the original lines, and the immutable confirmation metadata. Existing sales, amounts, quantities, PDF origins, cancellation rules, account isolation, and portfolio isolation remain intact. Ranking requests take the owner ID from the authenticated server session.

An authorized historical correction can append this metadata to the exact approved records after taking a private snapshot and checking revisions. Maintenance must preserve all other records, run with validation triggers enabled, verify unchanged non-target records, and retain its backup outside the repository. No customer records or maintenance SQL containing personal data belong in source control.

Verification covers owner-confirmed manual sales, unverified declarations, mismatched amounts, other owners, cancelled orders, month boundaries, receipt-level settlements, and both client and product totals. The compatibility release runs unit tests and desktop/Android ranking regressions. It changes the server ranking calculation; existing installed clients use the same endpoint without requiring a new APK.
