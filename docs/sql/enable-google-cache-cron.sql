-- Apply only with the reviewed Google quota migration. Required BEFORE enabling Google in production.
-- Daily expiry of temporary Google coordinates; no client deletion or financial changes.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('rotamapa-google-cache-expiry','17 4 * * *','SELECT rotamapa_private.google_cache_cleanup()');
COMMIT;
