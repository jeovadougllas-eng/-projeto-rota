#!/usr/bin/env bash
# Disposable managed-local Docker only; no database URLs, no production connections.
set -euo pipefail
cd "$(dirname "$0")/.."
docker_local() { env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock "$@"; }
container="rotamapa-lifecycle-test-$$"
trap 'docker_local rm -fv "$container" >/dev/null 2>&1 || true' EXIT
image=postgres:16@sha256:f9a7b9ebf6f56201f949db745e47bc423c0f0f8294bafe991cc10bf74b029657
docker_local run -d --name "$container" --network none -e POSTGRES_HOST_AUTH_METHOD=trust "$image" >/dev/null
for attempt in {1..30}; do
 if docker_local logs "$container" 2>&1 | grep -q "init process complete" && docker_local exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
 if [ "$attempt" = 30 ]; then echo 'Local Postgres did not become ready' >&2; exit 1; fi
 sleep 1
done
docker_local exec "$container" psql -U postgres -v ON_ERROR_STOP=1 -c 'CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;'
for file in test-db/portfolios-base.sql docs/sql/enable-visit-history.sql docs/sql/enable-saved-routes-and-plans.sql docs/sql/enable-commerce.sql docs/sql/enable-portfolios.sql docs/sql/enable-portfolio-plan-access.sql docs/sql/enable-campaign-unit-prices.sql docs/sql/enable-invoice-pdf-orders.sql docs/sql/enable-provisional-billing.sql test-db/clients-shape.sql docs/sql/enable-portfolio-versions.sql test-db/qa-auth-shape.sql docs/sql/enable-plan-testing.sql test-db/membership-auth-shape.sql supabase/migrations/20261107035047_signature_membership_identity.sql supabase/migrations/20261109000100_insider_membership.sql supabase/migrations/20261107113850_explicit_manual_invoicing.sql supabase/migrations/20261109000200_portfolio_lifecycle.sql test-db/portfolio-lifecycle.sql supabase/migrations/20261109000300_monthly_pdf_imports.sql test-db/pdf-import-quota.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done

node scripts/monthly-pdf-db-fixture.mjs | docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1
for file in test-db/library-storage-shape.sql supabase/migrations/20261110000100_document_library.sql test-db/document-library.sql test-db/library-commissions.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done

for file in supabase/migrations/20261110030933_imported_promotion_pricing.sql test-db/imported-promotions.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done
for file in supabase/migrations/20261110033302_catalog_deletion_workflow.sql test-db/catalog-deletion.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done
for file in supabase/migrations/20261110034338_manual_invoice_date.sql test-db/manual-invoice-date.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done
for file in supabase/migrations/20261110204232_google_location_limits.sql test-db/google-location.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done

docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < test-db/portfolio-exclusion.sql
for file in supabase/migrations/20261112235921_editable_unbilled_orders.sql test-db/editable-orders.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done
docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261113010134_pending_pdf_order_adjustments.sql
node scripts/pdf-amendment-db-fixture.mjs | docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1
