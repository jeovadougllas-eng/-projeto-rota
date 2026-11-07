-- Preserve the private bucket and ownership policies. Add CSV and JSON export types.
BEGIN;
DO $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='traxelo-visit-exports' AND NOT public) THEN RAISE EXCEPTION 'Private export bucket unavailable'; END IF;
END;$$;
UPDATE storage.buckets SET allowed_mime_types=ARRAY(SELECT DISTINCT unnest(coalesce(allowed_mime_types,ARRAY[]::text[])||ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv;charset=utf-8','text/csv','application/json'])) WHERE id='traxelo-visit-exports' AND NOT public;
COMMIT;
