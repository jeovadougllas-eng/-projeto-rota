#!/usr/bin/env bash
# Disposable managed-local Docker only; no database URLs, no production connections.
set -euo pipefail
cd "$(dirname "$0")/.."
docker_local() { env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock "$@"; }
container="rotamapa-insider-test-$$"
trap 'docker_local rm -fv "$container" >/dev/null 2>&1 || true' EXIT
image=postgres:16@sha256:f9a7b9ebf6f56201f949db745e47bc423c0f0f8294bafe991cc10bf74b029657
docker_local run -d --name "$container" --network none -e POSTGRES_HOST_AUTH_METHOD=trust "$image" >/dev/null
for attempt in {1..30}; do
 if docker_local exec "$container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
 if [ "$attempt" = 30 ]; then echo 'Local Postgres did not become ready' >&2; exit 1; fi
 sleep 1
done
for file in test-db/insider-base.sql supabase/migrations/20261107035047_signature_membership_identity.sql supabase/migrations/20261109000100_insider_membership.sql test-db/insider.sql; do
 docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$file"
done
