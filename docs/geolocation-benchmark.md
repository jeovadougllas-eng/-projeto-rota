# Read-only Geoapify × TomTom benchmark

URL: `/geolocation-test.html`. This is a separate diagnostic page. The normal customer geocoder, saved positions, routing, authentication callbacks and APK are unchanged.

## Credentials and deployment

Vercel project `traxio-preview`, production scope of this TEST project only:
- `GEO_BENCH_GEOAPIFY_KEY`, Secret
- `GEO_BENCH_TOMTOM_KEY`, Secret

These keys do not activate `GEOAPIFY_API_KEY` in the existing geocoder. No provider keys are sent to the browser or decrypted by the development tools. No paid subscription is requested.

GET `/api/geolocation-benchmark` reports only configured flags. POST verifies the ordinary user's Supabase access token against `/auth/v1/user`; anonymous users are rejected. The API does not use a service-role key, query or write customer records. Origin is restricted for browser POSTs. The page reads the same user's local portfolio only when its existing owner guard matches; otherwise SELECTs that user's cloud records with an explicit user_id filter under existing RLS. No SQL migration or account creation.

## How to run real portfolio validation

1. Sign in at https://traxio-preview.vercel.app/ in the same browser.
2. Open https://traxio-preview.vercel.app/geolocation-test.html and load the portfolio.
3. Authorize names and addresses to be sent to the two providers.
4. Run the first 10, inspect provider HTTP errors and candidate evidence. Then run the whole portfolio if appropriate.
5. Download the JSON report before closing. It contains commercial names/addresses and results, not tokens or keys; treat it as customer data. It is not stored publicly or sent to repository/CI.

The report says how many were requested, processed, compatible, conflicting and failed. An interrupted run is not a complete portfolio result. 80% of 157 means at least 126 compatible addresses. This is address compatibility, NOT verified physical accuracy or verified shop entrances. No automatic acceptance into the portfolio exists on this page.

## Search and assessment

Each provider receives the same parsed original address and optional name. Geoapify structured forward geocode first, then text name+address when required. TomTom Orbis Geocode v2 first, then Places Discover v3 with POI and BR filters when required. No routing/map migration.

Conservative matching reuses the normal street/number/city/CEP/district classifier, adds mandatory matching UF and, for name fallback, matching normalized name. Approximate Geoapify results and TomTom streets/areas never count as compatible. Missing/invalid/0,0 coordinates do not count. Multiple address candidates more than 40 m apart require review; compatible results from different providers more than 60 m apart count as conflict. TomTom address/POI record types alone do not prove entrance or surveyed rooftop precision. The API schema does not expose an equivalent rooftop confidence, so results are labeled address records, not precise coordinates.

Up to 2 requests per provider per client; no automatic retry of 401/403/429. Other failed first lookups may receive at most one name fallback. Max 250 customers per UI run. UI submits sequentially with 3.5 seconds between responses. Per-user per-instance guard 30 clients/min and 320/hour. This is NOT a durable global billing cap. Provider free-plan quotas remain authoritative. No durable cache or permanent provider coordinate storage is introduced. In-flight calls may complete after pressing Stop; no additional clients are submitted.

## Verification boundaries

Node unit tests use documented provider schemas and fake keys. Playwright fixtures use synthetic customers and fake provider responses; they verify auth gating, owner isolation, selection scope, consent, multi-city inputs, cancellation, quota errors, download and no original-data mutation at desktop/tablet resolutions. Public deployment verification checks HTTP and configured flags only. None of those is a real 157-customer accuracy benchmark. Real provider validity/coverage requires the owner's signed-in run; no access to the owner's session is requested or fabricated.

References consulted 2026-10-26:
- https://docs.tomtom.com/geocoding-api/documentation/tomtom-orbis-maps/v2/geocode
- https://docs.tomtom.com/places-search-api/documentation/places-search/discover
- https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/
- https://supabase.com/docs/reference/javascript/auth-getuser
