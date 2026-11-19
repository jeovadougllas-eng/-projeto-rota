-- User-reviewed daily copies are independent offers; the source document remains immutable.
BEGIN;
CREATE OR REPLACE FUNCTION rotamapa_private.check_copied_imported_campaign(who uuid, portfolio uuid, campaign jsonb)
RETURNS void LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE original jsonb;source jsonb;product jsonb;entry jsonb;source_id text;source_day text;target_day text;amount bigint;base bigint;
BEGIN
 IF who IS DISTINCT FROM auth.uid() OR portfolio IS DISTINCT FROM public.rotamapa_current_portfolio() THEN
  RAISE EXCEPTION 'Abra a conta e a carteira corretas para copiar condições.' USING ERRCODE='42501';
 END IF;
 IF (traxelo_private.portfolio_plan_access()->>'plan') NOT IN ('plus','pro') THEN RAISE EXCEPTION 'Campanhas importadas disponíveis nos planos Executivo e Elite.' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(campaign->'copiedFrom') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Confira a origem da cópia.';END IF;
 source_id:=campaign#>>'{copiedFrom,sourceId}';source_day:=campaign#>>'{copiedFrom,sourceDate}';target_day:=campaign->>'startDate';
 IF coalesce(source_day,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR coalesce(target_day,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR campaign->>'endDate' IS DISTINCT FROM target_day OR source_day=target_day THEN RAISE EXCEPTION 'A cópia do Dia D exige datas válidas e diferentes.';END IF;
 PERFORM source_day::date;PERFORM target_day::date;
 SELECT i.data INTO original FROM public.rotamapa_library_items i WHERE i.user_id=who AND i.portfolio_id=portfolio AND i.kind='campaigns' AND i.id=campaign#>>'{imported,documentId}' AND i.source_hash=campaign#>>'{imported,sourceHash}';
 IF original IS NULL THEN RAISE EXCEPTION 'Sincronize o documento original antes de copiar condições.';END IF;
 IF source_id=campaign#>>'{imported,documentId}' THEN
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(original->'entries') e WHERE e->>'validFrom'=source_day AND e->>'validTo'=source_day) THEN RAISE EXCEPTION 'A data de origem não corresponde ao Dia D do documento.';END IF;
 ELSIF coalesce(source_id,'') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
  IF source_id=campaign->>'id' THEN RAISE EXCEPTION 'A cópia deve preservar o registro de origem.';END IF;
  SELECT i.data INTO source FROM public.rotamapa_commerce_items i WHERE i.user_id=who AND i.portfolio_id=portfolio AND i.id=source_id::uuid AND i.kind='campaign';
  IF source IS NULL OR source->>'type' IS DISTINCT FROM 'importada' OR source->>'startDate' IS DISTINCT FROM source_day OR source->>'endDate' IS DISTINCT FROM source_day OR source#>>'{imported,documentId}' IS DISTINCT FROM campaign#>>'{imported,documentId}' OR source#>>'{imported,sourceHash}' IS DISTINCT FROM campaign#>>'{imported,sourceHash}' THEN RAISE EXCEPTION 'A campanha de origem mudou ou pertence a outra carteira.';END IF;
 ELSE RAISE EXCEPTION 'Confira a origem da cópia.';
 END IF;
 SELECT i.data INTO product FROM public.rotamapa_commerce_items i WHERE i.user_id=who AND i.portfolio_id=portfolio AND i.kind='product' AND i.id::text=campaign->>'productId' AND coalesce(i.data->>'disabled','false')<>'true';
 IF product IS NULL THEN RAISE EXCEPTION 'Escolha um produto cadastrado e ativo.';END IF;
 base:=(product->>'priceCents')::bigint;
 IF jsonb_typeof(campaign#>'{imported,entries}') IS DISTINCT FROM 'array' OR jsonb_array_length(campaign#>'{imported,entries}') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Confira as faixas da cópia.';END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(campaign#>'{imported,entries}') LOOP
  IF jsonb_typeof(entry) IS DISTINCT FROM 'object' OR entry->>'productId' IS DISTINCT FROM campaign->>'productId' OR entry->>'validFrom' IS DISTINCT FROM target_day OR entry->>'validTo' IS DISTINCT FROM target_day THEN RAISE EXCEPTION 'Confira a apresentação e as datas de cada faixa.';END IF;
  IF coalesce(entry->>'minimum','') !~ '^[0-9]{1,7}$' THEN RAISE EXCEPTION 'Quantidade mínima inválida.';END IF;
  amount:=(entry->>'minimum')::bigint;IF amount NOT BETWEEN 1 AND 1000000 THEN RAISE EXCEPTION 'Quantidade mínima inválida.';END IF;
  IF (entry->>'priceCents' IS NULL)=(entry->>'discountBps' IS NULL) THEN RAISE EXCEPTION 'Informe preço OU desconto em cada faixa.';END IF;
  IF entry->>'priceCents' IS NOT NULL THEN
   IF entry->>'priceCents' !~ '^[0-9]{1,10}$' THEN RAISE EXCEPTION 'Preço da cópia inválido.';END IF;
   amount:=(entry->>'priceCents')::bigint;IF amount NOT BETWEEN 1 AND base THEN RAISE EXCEPTION 'Confira o preço fixo e a tabela atual.';END IF;
  ELSE
   IF entry->>'discountBps' !~ '^[0-9]{1,5}$' THEN RAISE EXCEPTION 'Desconto da cópia inválido.';END IF;
   amount:=(entry->>'discountBps')::bigint;IF amount NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Desconto da cópia inválido.';END IF;
  END IF;
  IF coalesce(entry->>'stock','')<>'' AND (entry->>'stock' !~ '^[0-9]{1,7}$' OR (entry->>'stock')::numeric>1000000) THEN RAISE EXCEPTION 'Confira o estoque informado.';END IF;
  IF coalesce(entry->>'startTime','')<>'' AND entry->>'startTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' OR coalesce(entry->>'endTime','')<>'' AND entry->>'endTime' !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN RAISE EXCEPTION 'Confira os horários da cópia.';END IF;
  IF coalesce(entry->>'startTime','')<>'' AND coalesce(entry->>'endTime','')<>'' AND entry->>'startTime'>entry->>'endTime' THEN RAISE EXCEPTION 'Confira a ordem dos horários.';END IF;
  IF length(coalesce(entry->>'region',''))>160 OR length(coalesce(entry->>'restrictions',''))>10000 THEN RAISE EXCEPTION 'Confira a região e as restrições da cópia.';END IF;
 END LOOP;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.check_copied_imported_campaign(uuid,uuid,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.check_copied_imported_campaign(uuid,uuid,jsonb) TO authenticated;

-- Keep all guards for untouched imports. Only explicitly copied daily offers use the new path.
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.check_imported_campaign(uuid,uuid,jsonb)'::regprocedure);
 anchor text:='IF coalesce(campaign->>''startDate'','''') !~';
BEGIN
 IF strpos(source,'rotamapa_private.check_copied_imported_campaign')>0 THEN RETURN;END IF;
 IF strpos(source,anchor)=0 OR strpos(source,'Preserve a apresentação e as condições do documento original.')=0 THEN RAISE EXCEPTION 'Validador de campanhas divergiu. Confira antes de aplicar.';END IF;
 source:=replace(source,anchor,'IF campaign ? ''copiedFrom'' THEN PERFORM rotamapa_private.check_copied_imported_campaign(who,portfolio,campaign);RETURN;END IF;'||E'\n '||anchor);
 EXECUTE source;
END;$migration$;
NOTIFY pgrst,'reload schema';
COMMIT;
