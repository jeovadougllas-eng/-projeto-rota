BEGIN;
-- Keep immutable legacy snapshots readable; new imports carry the explicit net totals from the CSV.
DO $copy$
DECLARE source text:=pg_get_functiondef('rotamapa_private.check_bussola(jsonb)'::regprocedure);
BEGIN
 IF strpos(source,'FUNCTION rotamapa_private.check_bussola(')=0 THEN RAISE EXCEPTION 'Unexpected Bussola validator';END IF;
 EXECUTE replace(source,'FUNCTION rotamapa_private.check_bussola(','FUNCTION rotamapa_private.check_bussola_legacy(');
END;$copy$;
REVOKE ALL ON FUNCTION rotamapa_private.check_bussola_legacy(jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.check_bussola_legacy(jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION rotamapa_private.check_bussola(o jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE item jsonb;k text;legacy jsonb;legacy_items jsonb:='[]';requested_net bigint:=0;attended_net bigint:=0;billed_net bigint:=0;legacy_net bigint:=0;
BEGIN
 IF o->>'version' IS DISTINCT FROM '2' THEN PERFORM rotamapa_private.check_bussola_legacy(o);RETURN;END IF;
 IF jsonb_typeof(o->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(o->'items') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Itens líquidos inválidos';END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(o->'items') LOOP
  FOREACH k IN ARRAY ARRAY['netRequestedCents','netAttendedCents','netBilledCents'] LOOP
   IF jsonb_typeof(item->k) IS DISTINCT FROM 'number' OR coalesce(item->>k,'') !~ '^[0-9]+$' OR (item->>k)::numeric>9000000000000 THEN RAISE EXCEPTION 'Total líquido inválido';END IF;
  END LOOP;
  IF item->>'attended'='0' AND (item->>'netAttendedCents')::bigint<>0 OR item->>'invoiced'='0' AND (item->>'netBilledCents')::bigint<>0 THEN RAISE EXCEPTION 'Valor líquido sem quantidade';END IF;
  requested_net:=requested_net+(item->>'netRequestedCents')::bigint;attended_net:=attended_net+(item->>'netAttendedCents')::bigint;billed_net:=billed_net+(item->>'netBilledCents')::bigint;
  legacy_net:=legacy_net+(item->>'invoiced')::bigint*(item->>'netUnitCents')::bigint;
  legacy_items:=legacy_items||jsonb_build_array(item||jsonb_build_object('netBilledCents',(item->>'invoiced')::bigint*(item->>'netUnitCents')::bigint));
 END LOOP;
 IF greatest(requested_net,attended_net,billed_net)>9000000000000 OR o->>'netRequestedCents' IS DISTINCT FROM requested_net::text OR o->>'netAttendedCents' IS DISTINCT FROM attended_net::text OR o->>'netBilledCents' IS DISTINCT FROM billed_net::text THEN RAISE EXCEPTION 'Soma dos totais líquidos diverge do CSV';END IF;
 -- Legacy validation is reused only for identity, quantities, dates and diagnostic gross fields.
 -- Its reconstructed net amount is never persisted or used as the explicit financial total.
 legacy:=o||jsonb_build_object('version',1,'items',legacy_items,'netBilledCents',legacy_net);
 PERFORM rotamapa_private.check_bussola_legacy(legacy);
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.check_bussola(jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.check_bussola(jsonb) TO authenticated;
DO $patch$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_bussola()'::regprocedure);
anchor text:='  IF new.revision<>1 OR';
BEGIN
 IF strpos(source,anchor)=0 OR strpos(source,'new.data->>''totalCents'' IS DISTINCT FROM o->>''requestedCents''')=0 THEN RAISE EXCEPTION 'Unexpected Bussola sale validator';END IF;
 source:=replace(source,anchor,E'  IF o->>''version'' IS DISTINCT FROM ''2'' THEN RAISE EXCEPTION ''Atualize o RM para importar os totais líquidos do CSV.'';END IF;\n'||anchor);
 source:=replace(source,'new.data->>''totalCents'' IS DISTINCT FROM o->>''requestedCents''','new.data->>''totalCents'' IS DISTINCT FROM (CASE WHEN o->>''version''=''2'' THEN o->>''netRequestedCents'' ELSE o->>''requestedCents'' END)');
 source:=replace(source,'line->>''unitCents'' IS DISTINCT FROM item->>''grossUnitCents''','line->>''unitCents'' IS DISTINCT FROM (CASE WHEN o->>''version''=''2'' THEN (((item->>''netRequestedCents'')::bigint+(item->>''requested'')::bigint/2)/(item->>''requested'')::bigint)::text ELSE item->>''grossUnitCents'' END)');
 source:=replace(source,'line->>''totalCents'' IS DISTINCT FROM ((item->>''requested'')::bigint*(item->>''grossUnitCents'')::bigint)::text','line->>''totalCents'' IS DISTINCT FROM (CASE WHEN o->>''version''=''2'' THEN item->>''netRequestedCents'' ELSE ((item->>''requested'')::bigint*(item->>''grossUnitCents'')::bigint)::text END)');
 EXECUTE source;
END;$patch$;
NOTIFY pgrst,'reload schema';
COMMIT;
