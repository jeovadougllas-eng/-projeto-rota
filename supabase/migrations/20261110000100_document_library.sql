-- DRAFT: review and test locally before any separately authorized production rollout.
BEGIN;
CREATE TABLE public.rotamapa_library_items (
 user_id uuid NOT NULL,portfolio_id uuid NOT NULL,id text NOT NULL CHECK(id ~ '^[a-f0-9]{64}$'),
 kind text NOT NULL CHECK(kind IN ('campaigns','boxes','commissions','catalog','snapshot')),
 source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND octet_length(data::text)<=524288),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,portfolio_id,id),
 FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id)
);
ALTER TABLE public.rotamapa_library_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rotamapa_library_items FROM public,anon,authenticated;
GRANT SELECT ON public.rotamapa_library_items TO authenticated;
GRANT ALL ON public.rotamapa_library_items TO service_role;
CREATE FUNCTION public.rotamapa_library_visible(p_owner uuid,p_portfolio uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_owner=auth.uid() AND p_portfolio=public.rotamapa_current_portfolio() AND coalesce(auth.jwt()->>'is_anonymous','false')<>'true'
 AND NOT EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=p_owner AND portfolio_id=p_portfolio AND state='deleted');
$$;
REVOKE ALL ON FUNCTION public.rotamapa_library_visible(uuid,uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_library_visible(uuid,uuid) TO authenticated;
CREATE POLICY owned_library ON public.rotamapa_library_items FOR SELECT TO authenticated USING(
 user_id=(SELECT auth.uid()) AND portfolio_id=(SELECT public.rotamapa_current_portfolio()) AND public.rotamapa_library_visible(user_id,portfolio_id)
);
-- All writes use one guarded, append-only RPC; no client UPDATE/DELETE grants.
CREATE FUNCTION public.rotamapa_library_put(p_id text,p_kind text,p_source_hash text,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();portfolio uuid:=public.rotamapa_current_portfolio();item public.rotamapa_library_items%rowtype;access jsonb;entry jsonb;path text;sale jsonb;line jsonb;receipt jsonb;settlement jsonb;billing_date date;line_index integer;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 IF p_id IS NULL OR p_id !~ '^[a-f0-9]{64}$' OR p_source_hash IS NULL OR p_source_hash !~ '^[a-f0-9]{64}$' OR p_kind IS NULL OR p_kind NOT IN ('campaigns','boxes','commissions','catalog','snapshot') OR p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>524288 THEN RAISE EXCEPTION 'Documento inválido.' USING ERRCODE='22023';END IF;
 PERFORM 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=portfolio FOR SHARE;
 IF NOT FOUND OR EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=portfolio) THEN RAISE EXCEPTION 'Carteira indisponível.' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text||':'||portfolio::text||':'||p_id,94));
 SELECT * INTO item FROM public.rotamapa_library_items WHERE user_id=who AND portfolio_id=portfolio AND id=p_id;
 IF FOUND THEN
  IF item.kind IS DISTINCT FROM p_kind OR item.source_hash IS DISTINCT FROM p_source_hash OR (CASE WHEN p_kind='snapshot' THEN item.data ELSE item.data-'fileName' END) IS DISTINCT FROM (CASE WHEN p_kind='snapshot' THEN p_data ELSE p_data-'fileName' END) THEN RAISE EXCEPTION 'Documento histórico diferente. Preserve as duas versões e revise.' USING ERRCODE='40001';END IF;
  RETURN to_jsonb(item);
 END IF;
 access:=traxelo_private.portfolio_plan_access();
 IF p_kind IN ('campaigns','commissions','catalog') AND access->>'plan'='free' THEN RAISE EXCEPTION 'Importação disponível nos planos Executivo e Elite.' USING ERRCODE='42501';END IF;
 IF p_kind='catalog' THEN
  IF coalesce(p_data->>'format','')<>'pdf' OR coalesce(length(p_data->>'fileName'),0) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Catálogo inválido.';END IF;
  path:=who::text||'/'||portfolio::text||'/'||p_source_hash||'.pdf';
  IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='rotamapa-catalogs' AND name=path) THEN RAISE EXCEPTION 'Envie o PDF original antes de concluir a importação.';END IF;
 ELSIF p_kind='snapshot' THEN
  IF p_data->>'ownerId' IS DISTINCT FROM who::text OR p_data->>'portfolioId' IS DISTINCT FROM portfolio::text OR coalesce(p_data#>>'{rule,rateBps}','') !~ '^[0-9]{1,5}$' OR (p_data#>>'{rule,rateBps}')::integer>10000 THEN RAISE EXCEPTION 'Snapshot inválido.';END IF;
  SELECT data INTO sale FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=portfolio AND kind='sale' AND id::text=p_data->>'saleId' AND data->>'status'='confirmed';
  IF sale IS NULL THEN RAISE EXCEPTION 'Sincronize a venda antes de preservar sua projeção.';END IF;
  IF coalesce(p_data->>'lineId','') !~ '^[0-9]{1,3}$' THEN RAISE EXCEPTION 'Item faturado inválido.';END IF;
  line_index:=(p_data->>'lineId')::integer;line:=sale->'lines'->line_index;
  IF line IS NULL OR line->>'productId' IS DISTINCT FROM p_data->>'productId' THEN RAISE EXCEPTION 'Produto faturado divergente.';END IF;
  IF NOT(sale ? 'source') THEN
   IF sale#>>'{manualBilling,state}' IS DISTINCT FROM 'invoiced' OR sale#>>'{manualBilling,method}' IS DISTINCT FROM 'owner_confirmation' OR sale#>>'{manualBilling,confirmedBy}' IS DISTINCT FROM who::text THEN RAISE EXCEPTION 'Somente vendas faturadas entram na projeção.';END IF;
   billing_date:=coalesce(sale#>>'{manualBilling,invoiceDate}',sale->>'date')::date;
  ELSE
   receipt:=sale#>ARRAY['source','receipts',line->>'sourceReceipt'];
   SELECT value INTO settlement FROM jsonb_array_elements(coalesce(sale->'settlements','[]')) WHERE value->>'receipt'=line->>'sourceReceipt';
   IF sale#>'{source,version}'='2'::jsonb AND coalesce(settlement->>'state',receipt->>'stage','')<>'invoiced' THEN RAISE EXCEPTION 'Pedido pendente não gera comissão.';END IF;
   billing_date:=coalesce(settlement->>'date',receipt->>'invoiceDate')::date;
  END IF;
  IF billing_date IS NULL OR billing_date::text IS DISTINCT FROM p_data->>'date' THEN RAISE EXCEPTION 'Data de faturamento divergente.';END IF;
  IF NOT EXISTS(SELECT 1 FROM public.rotamapa_library_items d CROSS JOIN LATERAL jsonb_array_elements(d.data->'entries') e WHERE d.user_id=who AND d.portfolio_id=portfolio AND d.kind='commissions' AND e=p_data->'rule' AND e->>'companyId'=p_data->>'companyId' AND e->>'productId'=p_data->>'productId' AND (e->>'validFrom')::date<=billing_date AND (nullif(e->>'validTo','') IS NULL OR (e->>'validTo')::date>=billing_date) AND coalesce(e->>'restrictions','')='') THEN RAISE EXCEPTION 'Sincronize e revise a regra de comissão antes de preservar a projeção.';END IF;
 ELSE
  IF jsonb_typeof(p_data->'entries') IS DISTINCT FROM 'array' OR jsonb_array_length(p_data->'entries') NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Confira as condições extraídas.';END IF;
  FOR entry IN SELECT value FROM jsonb_array_elements(p_data->'entries') LOOP
   IF jsonb_typeof(entry)<>'object' OR coalesce(length(entry->>'name'),0)>300 THEN RAISE EXCEPTION 'Produto inválido.';END IF;
   IF p_kind='boxes' THEN
    IF coalesce(entry->>'units','') !~ '^[0-9]{1,7}$' OR (entry->>'units')::integer NOT BETWEEN 1 AND 1000000 OR coalesce(entry->>'code','')='' AND coalesce(entry->>'name','')='' THEN RAISE EXCEPTION 'Unidades por caixa inválidas.';END IF;
   ELSIF p_kind='commissions' THEN
    IF entry->>'ownerId' IS DISTINCT FROM who::text OR entry->>'portfolioId' IS DISTINCT FROM portfolio::text OR coalesce(entry->>'rateBps','') !~ '^[0-9]{1,5}$' OR (entry->>'rateBps')::integer>10000 OR coalesce(entry->>'validFrom','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(length(entry->>'companyId'),0) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Taxa ou vigência inválida.';END IF;
    PERFORM (entry->>'validFrom')::date;
    IF nullif(entry->>'validTo','') IS NOT NULL AND (entry->>'validTo')::date<(entry->>'validFrom')::date THEN RAISE EXCEPTION 'Vigência inválida.';END IF;
    IF NOT EXISTS(SELECT 1 FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=portfolio AND kind='product' AND id::text=entry->>'productId') THEN RAISE EXCEPTION 'Produto de outra carteira ou ainda não sincronizado.';END IF;
   ELSE
    IF coalesce(entry->>'validFrom','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(entry->>'validTo','') !~ '^\d{4}-\d{2}-\d{2}$' OR (entry->>'validTo')::date<(entry->>'validFrom')::date OR coalesce(entry->>'minimum','') !~ '^[0-9]{1,7}$' OR (entry->>'minimum')::integer NOT BETWEEN 1 AND 1000000 THEN RAISE EXCEPTION 'Condição comercial inválida.';END IF;
    IF (entry->>'priceCents' IS NULL)=(entry->>'discountBps' IS NULL) THEN RAISE EXCEPTION 'Informe preço OU desconto.';END IF;
    IF entry->>'priceCents' IS NOT NULL AND (coalesce(entry->>'priceCents','') !~ '^[0-9]{1,10}$' OR (entry->>'priceCents')::bigint NOT BETWEEN 1 AND 1000000000) THEN RAISE EXCEPTION 'Preço inválido.';END IF;
    IF entry->>'discountBps' IS NOT NULL AND (coalesce(entry->>'discountBps','') !~ '^[0-9]{1,5}$' OR (entry->>'discountBps')::integer>10000) THEN RAISE EXCEPTION 'Desconto inválido.';END IF;
   END IF;
  END LOOP;
 END IF;
 IF p_kind<>'snapshot' AND p_data->>'format'='pdf' THEN PERFORM rotamapa_private.record_pdf_import(who,portfolio,p_source_hash);END IF;
 INSERT INTO public.rotamapa_library_items(user_id,portfolio_id,id,kind,source_hash,data) VALUES(who,portfolio,p_id,p_kind,p_source_hash,p_data) RETURNING * INTO item;
 RETURN to_jsonb(item);
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_library_put(text,text,text,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_library_put(text,text,text,jsonb) TO authenticated;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('rotamapa-catalogs','rotamapa-catalogs',false,20971520,ARRAY['application/pdf']);
CREATE FUNCTION public.rotamapa_catalog_allowed(p_path text,p_upload boolean DEFAULT false) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();portfolio uuid:=public.rotamapa_current_portfolio();parts text[]:=string_to_array(p_path,'/');
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' OR array_length(parts,1)<>3 OR parts[1] IS DISTINCT FROM who::text OR parts[2] IS DISTINCT FROM portfolio::text OR parts[3] !~ '^[a-f0-9]{64}\.pdf$' THEN RETURN false;END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=portfolio) OR EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=portfolio) THEN RETURN false;END IF;
 IF p_upload THEN RETURN (traxelo_private.portfolio_plan_access()->>'plan') IN ('plus','pro');END IF;
 -- The same owner can verify a staged original after a lost response, before retrying finalization.
 RETURN (traxelo_private.portfolio_plan_access()->>'plan') IN ('plus','pro') OR EXISTS(SELECT 1 FROM public.rotamapa_library_items WHERE user_id=who AND portfolio_id=portfolio AND kind='catalog' AND source_hash=left(parts[3],64));
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_catalog_allowed(text,boolean) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_catalog_allowed(text,boolean) TO authenticated;
CREATE POLICY catalog_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='rotamapa-catalogs' AND public.rotamapa_catalog_allowed(name,true));
CREATE POLICY catalog_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='rotamapa-catalogs' AND public.rotamapa_catalog_allowed(name,false));
-- No client overwrite/delete of historical originals. Definite deletion needs an authorized Storage cleanup.
CREATE FUNCTION rotamapa_private.library_lifecycle() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF new.state='deleted' THEN
  IF EXISTS(SELECT 1 FROM public.rotamapa_library_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND kind='catalog') OR EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='rotamapa-catalogs' AND left(name,length(new.user_id::text||'/'||new.portfolio_id::text||'/'))=new.user_id::text||'/'||new.portfolio_id::text||'/') THEN RAISE EXCEPTION 'Esta carteira contém catálogos originais. Arquive para preservar o backup; a exclusão definitiva requer a limpeza autorizada dos originais no Storage.';END IF;
  DELETE FROM public.rotamapa_library_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id;
 END IF;RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.library_lifecycle() FROM public,anon,authenticated;
CREATE TRIGGER library_lifecycle_guard BEFORE INSERT OR UPDATE ON rotamapa_private.portfolio_lifecycle FOR EACH ROW EXECUTE FUNCTION rotamapa_private.library_lifecycle();
NOTIFY pgrst,'reload schema';
COMMIT;
