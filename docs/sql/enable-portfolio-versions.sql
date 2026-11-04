-- Transactional, owned portfolio versions. No customer/visit/sale is deleted.
BEGIN;
CREATE TABLE public.rotamapa_portfolio_versions(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 portfolio_id uuid NOT NULL,
 id uuid NOT NULL,
 label text NOT NULL CHECK(length(btrim(label)) BETWEEN 1 AND 100),
 source text NOT NULL CHECK(length(source)<=200),
 clients jsonb NOT NULL CHECK(jsonb_typeof(clients)='array' AND octet_length(clients::text)<=33554432),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,id),
 FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id)
);
CREATE INDEX rotamapa_portfolio_version_list ON public.rotamapa_portfolio_versions(user_id,portfolio_id,created_at DESC);
ALTER TABLE public.rotamapa_portfolio_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rotamapa_portfolio_versions FROM public,anon,authenticated;
GRANT SELECT ON public.rotamapa_portfolio_versions TO authenticated;
GRANT ALL ON public.rotamapa_portfolio_versions TO service_role;
CREATE POLICY own_selected_versions ON public.rotamapa_portfolio_versions FOR SELECT TO authenticated
USING(user_id=(select auth.uid()) AND portfolio_id=(select public.rotamapa_current_portfolio()) AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
CREATE FUNCTION rotamapa_private.replace_portfolio(p_portfolio uuid,p_operation uuid,p_expected jsonb,p_clients jsonb,p_label text,p_source text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); previous jsonb; current_rows jsonb; expected_count integer; row_count integer; c jsonb; ids text[]:='{}'; existing public.clients%rowtype; seen_ids text[]:='{}';
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' OR p_portfolio IS DISTINCT FROM public.rotamapa_current_portfolio() OR p_operation IS NULL THEN RAISE EXCEPTION 'Entre na conta e na carteira corretas.' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_clients) IS DISTINCT FROM 'array' OR jsonb_array_length(p_clients) NOT BETWEEN 1 AND 20000 OR octet_length(p_clients::text)>16777216 OR jsonb_typeof(p_expected) IS DISTINCT FROM 'array' OR coalesce(length(btrim(p_label)),0) NOT BETWEEN 1 AND 100 OR p_source IS NULL OR length(p_source)>200 THEN RAISE EXCEPTION 'Dados da atualização inválidos ou acima do limite técnico.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text||':'||p_portfolio::text||':portfolio_version',0));
 PERFORM 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=p_portfolio FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Carteira não encontrada.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.rotamapa_portfolio_versions WHERE user_id=who AND id=p_operation AND portfolio_id<>p_portfolio) THEN RAISE EXCEPTION 'Operação de outra carteira.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.rotamapa_portfolio_versions WHERE user_id=who AND id=p_operation AND portfolio_id=p_portfolio) THEN
  SELECT coalesce(jsonb_agg(jsonb_build_object('local_id',local_id,'data',data,'revision',revision) ORDER BY local_id),'[]'::jsonb) INTO current_rows FROM public.clients WHERE user_id=who AND portfolio_id=p_portfolio AND deleted_at IS NULL;
  RETURN jsonb_build_object('id',p_operation,'clients',current_rows,'replayed',true);
 END IF;
 PERFORM 1 FROM public.clients WHERE user_id=who AND portfolio_id=p_portfolio AND deleted_at IS NULL FOR UPDATE;
 SELECT count(*),coalesce(jsonb_agg(jsonb_build_object('id',local_id,'revision',revision)),'[]'::jsonb),coalesce(jsonb_agg(CASE WHEN data ? 'id' THEN data ELSE data||jsonb_build_object('id',local_id) END ORDER BY local_id),'[]'::jsonb) INTO row_count,current_rows,previous FROM public.clients WHERE user_id=who AND portfolio_id=p_portfolio AND deleted_at IS NULL;
 IF jsonb_array_length(p_expected)<>row_count OR NOT(p_expected @> current_rows AND current_rows @> p_expected) THEN RAISE EXCEPTION 'A carteira mudou em outro aparelho. Sincronize e refaça a comparação.' USING ERRCODE='40001'; END IF;
 FOR c IN SELECT value FROM jsonb_array_elements(p_clients) LOOP
  IF jsonb_typeof(c) IS DISTINCT FROM 'object' OR coalesce(length(c->>'id'),0) NOT BETWEEN 1 AND 250 OR (c->>'id')=ANY(ids) OR coalesce(length(btrim(c->>'name')),0) NOT BETWEEN 1 AND 500 OR (c ? 'active' AND jsonb_typeof(c->'active') IS DISTINCT FROM 'boolean') OR octet_length(c::text)>262144 THEN RAISE EXCEPTION 'Confira os nomes, identificadores e duplicidades.'; END IF;
  ids:=array_append(ids,c->>'id');
  IF EXISTS(SELECT 1 FROM public.clients WHERE user_id=who AND local_id=c->>'id' AND (portfolio_id<>p_portfolio OR deleted_at IS NOT NULL)) THEN RAISE EXCEPTION 'Identificador de cliente indisponível nesta carteira.' USING ERRCODE='42501'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.clients WHERE user_id=who AND portfolio_id=p_portfolio AND deleted_at IS NULL AND NOT(local_id=ANY(ids))) THEN RAISE EXCEPTION 'Preserve os clientes antigos como inativos na atualização.'; END IF;
 INSERT INTO public.rotamapa_portfolio_versions(user_id,portfolio_id,id,label,source,clients) VALUES(who,p_portfolio,p_operation,btrim(p_label),p_source,previous);
 FOR c IN SELECT value FROM jsonb_array_elements(p_clients) LOOP
  SELECT * INTO existing FROM public.clients WHERE user_id=who AND portfolio_id=p_portfolio AND local_id=c->>'id';
  IF existing.id IS NULL THEN
   INSERT INTO public.clients(user_id,portfolio_id,local_id,name,cnpj,city,neighborhood,address,zip_code,latitude,longitude,data)
   VALUES(who,p_portfolio,c->>'id',c->>'name',nullif(c->>'cnpj',''),nullif(c->>'city',''),nullif(c->>'neighborhood',''),nullif(c->>'address',''),nullif(c->>'cep',''),nullif(c->>'lat','')::double precision,nullif(c->>'lon','')::double precision,c);
  ELSIF existing.data IS DISTINCT FROM c THEN
   UPDATE public.clients SET name=c->>'name',cnpj=coalesce(nullif(c->>'cnpj',''),existing.cnpj),city=coalesce(nullif(c->>'city',''),existing.city),neighborhood=coalesce(nullif(c->>'neighborhood',''),existing.neighborhood),address=coalesce(nullif(c->>'address',''),existing.address),zip_code=coalesce(nullif(c->>'cep',''),existing.zip_code),latitude=nullif(c->>'lat','')::double precision,longitude=nullif(c->>'lon','')::double precision,data=c,revision=revision+1,updated_at=now()
   WHERE user_id=who AND portfolio_id=p_portfolio AND id=existing.id;
  END IF;
 END LOOP;
 UPDATE public.rotamapa_portfolios SET revision=revision+1,updated_at=now() WHERE user_id=who AND id=p_portfolio;
 SELECT coalesce(jsonb_agg(jsonb_build_object('local_id',local_id,'data',data,'revision',revision) ORDER BY local_id),'[]'::jsonb) INTO current_rows FROM public.clients WHERE user_id=who AND portfolio_id=p_portfolio AND deleted_at IS NULL;
 RETURN jsonb_build_object('id',p_operation,'clients',current_rows,'replayed',false);
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.replace_portfolio(uuid,uuid,jsonb,jsonb,text,text) FROM public,anon;
GRANT USAGE ON SCHEMA rotamapa_private TO authenticated;
GRANT EXECUTE ON FUNCTION rotamapa_private.replace_portfolio(uuid,uuid,jsonb,jsonb,text,text) TO authenticated;
CREATE FUNCTION public.rotamapa_replace_portfolio(p_portfolio uuid,p_operation uuid,p_expected jsonb,p_clients jsonb,p_label text,p_source text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT rotamapa_private.replace_portfolio(p_portfolio,p_operation,p_expected,p_clients,p_label,p_source)$$;
REVOKE ALL ON FUNCTION public.rotamapa_replace_portfolio(uuid,uuid,jsonb,jsonb,text,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_replace_portfolio(uuid,uuid,jsonb,jsonb,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
