-- Allow reviewed edits only to RM-created, unbilled orders. Preserve identity and append prior values.
BEGIN;
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_commerce()'::regprocedure);
anchor text:=$old$IF new.kind='sale' AND old.data->>'status' IN ('confirmed','cancelled') THEN$old$;
BEGIN
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Unexpected commerce validator; review required';END IF;
 source:=replace(source,anchor,$new$
 IF new.kind='sale' AND old.data->>'status'='confirmed' AND d->>'status'='confirmed'
 AND (d->'lines' IS DISTINCT FROM old.data->'lines' OR d->'totalCents' IS DISTINCT FROM old.data->'totalCents' OR d->'notes' IS DISTINCT FROM old.data->'notes') THEN
  IF old.data ? 'source' OR d ? 'source' OR old.data ? 'manualBilling' OR d ? 'manualBilling'
     OR coalesce(jsonb_array_length(old.data->'settlements'),0)>0 OR coalesce(jsonb_array_length(d->'settlements'),0)>0
     THEN RAISE EXCEPTION 'Only unbilled RM orders may be edited';END IF;
  IF (d-ARRAY['lines','totalCents','notes','updatedAt','version','editHistory']) IS DISTINCT FROM (old.data-ARRAY['lines','totalCents','notes','updatedAt','version','editHistory']) THEN RAISE EXCEPTION 'Order identity and original date must be preserved';END IF;
  IF jsonb_typeof(d->'editHistory') IS DISTINCT FROM 'array' OR jsonb_array_length(d->'editHistory')>50
     OR d->'editHistory' IS DISTINCT FROM (coalesce(old.data->'editHistory','[]'::jsonb)||jsonb_build_array(jsonb_build_object('lines',old.data->'lines','totalCents',old.data->'totalCents','notes',coalesce(old.data->>'notes',''))))
     THEN RAISE EXCEPTION 'Previous order revision must be preserved';END IF;
  -- Continue through full catalog, campaign, quantity and monetary validation below.
 ELSIF new.kind='sale' AND old.data->>'status' IN ('confirmed','cancelled') THEN
$new$);
 EXECUTE source;
END;
$migration$;
COMMIT;
