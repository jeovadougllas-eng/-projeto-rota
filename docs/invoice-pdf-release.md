# Reviewed invoice PDF orders

The existing sales calculator and client sales history offer **Importar pedidos em PDF**. The user selects one or two text reports in Mercado Farma's detailed format. PDF.js 4.10.38 is pinned through package-lock and prepared locally; its reader, worker and Apache license ship with web/PWA and the native bundle. Extraction runs on the device. Original PDFs are not uploaded or retained by the app.

A review shows order and invoice references, CNPJ, invoice date, original descriptions/EANs, attended quantities, exact final unit prices, each PDF's invoiced subtotal and the combined invoiced total. Distributor names are optional editable labels because the samples do not identify them. EAN/unique presentation suggestions must be checked; every line must map to a current portfolio catalog product. The client and a review checkbox are mandatory. A known client CNPJ mismatch blocks saving. Dates default to the latest invoice date and remain explicit.

One or two PDFs create **one sale**. Repeated catalog products retain separate lines/prices for each PDF rather than blending prices or recalculating campaign percentages. A linked confirmed visit is reused without registering a new visit. The source snapshots remain in client history, backup and exports, and account/portfolio changes invalidate the review. Offline sales use the existing durable outbox.

Only **total faturado** counts, per the user's explicit choice. Requested/attended totals are not substituted. Reports without a FATURADO status, readable text, matching line arithmetic or matching invoiced totals are rejected with guidance. No OCR, guessed products, guessed distributor, freight/tax adjustments or partial import are performed. Limit: two files, 10 MiB and 20 pages each, 100 combined billed lines.

The additive migration replaces the current invoker validator with an additional reviewed-PDF branch; existing product/campaign/manual-sale checks and immutable history remain. The import branch checks each receipt, quantity, price, reference, catalog ownership and exact sum. An owner/portfolio advisory transaction lock serializes duplicate-order/file-hash checks between devices. No new public functions, tables, privileges, file-storage buckets, customer rewrites or price/campaign changes are introduced. Existing cancelled invoices may be registered again intentionally; confirmed duplicates are blocked.

Uploaded customer PDFs remain private workspace attachments and are not committed to GitHub or included in CI artifacts. Automated tests use generated synthetic reports. Local extraction of both provided examples verified nine lines, 86 units and R$ 1,169.23 without creating any actual sale or sending the PDFs to a server.

Release verification and artifact identifiers will be recorded after CI and publication.
