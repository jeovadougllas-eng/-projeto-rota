BEGIN;
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_commerce()'::regprocedure); anchor text;
BEGIN
 anchor:='exists_pdf boolean;';IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'PDF validator declaration differs';END IF;
 source:=replace(source,anchor,anchor||' pdf_amendment boolean:=false;');
 anchor:=$anchor$   IF old.data->>'status' IN ('confirmed','cancelled') THEN$anchor$;
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'PDF validator update guard differs';END IF;
 source:=replace(source,anchor,$guard$
   IF new.data#>'{source,adjustedInRM}'='true'::jsonb AND
      (new.data-ARRAY['settlements','status','cancelReason','updatedAt','version']) IS DISTINCT FROM (old.data-ARRAY['settlements','status','cancelReason','updatedAt','version']) THEN
    IF old.data->>'status'<>'confirmed' OR new.data->>'status'<>'confirmed'
      OR old.data#>'{source,version}' IS DISTINCT FROM '2'::jsonb
      OR jsonb_array_length(old.data#>'{source,receipts}')<>1 OR jsonb_array_length(new.data#>'{source,receipts}')<>1
      OR old.data#>>'{source,receipts,0,stage}' IS DISTINCT FROM 'pending'
      OR coalesce(jsonb_array_length(old.data->'settlements'),0)<>0 OR coalesce(jsonb_array_length(new.data->'settlements'),0)<>0
      OR old.data ? 'manualBilling' OR new.data ? 'manualBilling'
      THEN RAISE EXCEPTION 'Only a single unbilled PDF order can be adjusted';END IF;
    IF (new.data-ARRAY['source','lines','totalCents','notes','updatedAt','version','importedOriginal','pdfEditHistory']) IS DISTINCT FROM (old.data-ARRAY['source','lines','totalCents','notes','updatedAt','version','importedOriginal','pdfEditHistory'])
      OR ((new.data->'source')-ARRAY['receipts','adjustedInRM']) IS DISTINCT FROM ((old.data->'source')-ARRAY['receipts','adjustedInRM'])
      OR ((new.data#>'{source,receipts,0}')-ARRAY['items','totalCents',CASE WHEN old.data#>>'{source,receipts,0,basis}'='requested' THEN 'requestedTotalCents' ELSE 'attendedTotalCents' END]) IS DISTINCT FROM ((old.data#>'{source,receipts,0}')-ARRAY['items','totalCents',CASE WHEN old.data#>>'{source,receipts,0,basis}'='requested' THEN 'requestedTotalCents' ELSE 'attendedTotalCents' END])
      OR new.data->'importedOriginal' IS DISTINCT FROM coalesce(old.data->'importedOriginal',old.data)
      THEN RAISE EXCEPTION 'Preserve original PDF, identity and order metadata';END IF;
    IF jsonb_typeof(new.data->'pdfEditHistory') IS DISTINCT FROM 'array' OR jsonb_array_length(new.data->'pdfEditHistory')>50
      OR new.data->'pdfEditHistory' IS DISTINCT FROM (coalesce(old.data->'pdfEditHistory','[]'::jsonb)||jsonb_build_array(jsonb_build_object('source',old.data->'source','lines',old.data->'lines','totalCents',old.data->'totalCents','notes',coalesce(old.data->>'notes',''))))
      THEN RAISE EXCEPTION 'Preserve previous PDF order revision';END IF;
    pdf_amendment:=true;
   END IF;
$guard$||anchor);
 anchor:=$anchor$OR (new.data-ARRAY['settlements','status','cancelReason','updatedAt','version']) IS DISTINCT FROM (old.data-ARRAY['settlements','status','cancelReason','updatedAt','version']) THEN$anchor$;
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'PDF immutable predicate differs';END IF;
 source:=replace(source,anchor,$new$OR (NOT pdf_amendment AND (new.data-ARRAY['settlements','status','cancelReason','updatedAt','version']) IS DISTINCT FROM (old.data-ARRAY['settlements','status','cancelReason','updatedAt','version'])) THEN$new$);
 EXECUTE source;
END;
$migration$;
COMMIT;
