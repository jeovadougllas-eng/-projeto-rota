#!/usr/bin/env bash
# Disposable local Docker; no network, real user, credentials or hosted writes.
set -euo pipefail
cd "$(dirname "$0")/.."
docker_local(){ env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock "$@"; }
container="rotamapa-campaign-copy-test-$$"
trap 'docker_local rm -fv "$container" >/dev/null 2>&1 || true' EXIT
docker_local run -d --name "$container" --network none -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16@sha256:f9a7b9ebf6f56201f949db745e47bc423c0f0f8294bafe991cc10bf74b029657 >/dev/null
for attempt in {1..30};do
 if docker_local logs "$container" 2>&1 | rg -q 'init process complete' && docker_local exec "$container" pg_isready -U postgres >/dev/null 2>&1;then break;fi
 if [ "$attempt" = 30 ];then echo 'Local Postgres did not start' >&2;exit 1;fi
 sleep 1
done
docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < test-db/campaign-reuse-base.sql
python3 - <<'PYSQL' | docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1
from pathlib import Path
s=Path('supabase/migrations/20261110030933_imported_promotion_pricing.sql').read_text().split('-- Extend the installed validator')[0]
print(s+'\nCOMMIT;')
PYSQL
docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/20261119151645_copied_dia_d_imported_conditions.sql
docker_local exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < test-db/campaign-reuse.sql
