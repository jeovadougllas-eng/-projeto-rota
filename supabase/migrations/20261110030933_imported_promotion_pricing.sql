-- DRAFT. Apply only to an isolated database until the owner approves rollout.
BEGIN;
CREATE FUNCTION rotamapa_private.commercial_norm(value text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT btrim(regexp_replace(translate(upper(coalesce(value,'')),'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ','AAAAAEEEEIIIIOOOOOUUUUC'),'[^A-Z0-9]+',' ','g'));
$$;
REVOKE ALL ON FUNCTION rotamapa_private.commercial_norm(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.commercial_norm(text) TO authenticated;

CREATE FUNCTION rotamapa_private.imported_entry_matches(who uuid,portfolio uuid,entry jsonb,product_id text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE candidates text[]; product jsonb;
BEGIN
 SELECT data INTO product FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=portfolio AND kind='product' AND id::text=product_id AND coalesce(data->>'disabled','false')<>'true';
 IF product IS NULL THEN RETURN false; END IF;
 IF coalesce(entry->>'productId','')<>'' THEN RETURN entry->>'productId'=product_id; END IF;
 IF coalesce(entry->>'code','')<>'' THEN
  SELECT array_agg(id::text) INTO candidates FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=portfolio AND kind='product' AND upper(btrim(data->>'code'))=upper(btrim(entry->>'code'));
  IF cardinality(candidates)>0 THEN RETURN cardinality(candidates)=1 AND candidates[1]=product_id AND (coalesce(entry->>'presentation','')='' OR rotamapa_private.commercial_norm(entry->>'presentation')=rotamapa_private.commercial_norm(product->>'presentation')); END IF;
 END IF;
 SELECT array_agg(id::text) INTO candidates FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=portfolio AND kind='product' AND rotamapa_private.commercial_norm(data->>'name')=rotamapa_private.commercial_norm(coalesce(entry->>'name',entry->>'description')) AND coalesce(entry->>'name',entry->>'description','')<>'' AND (coalesce(entry->>'presentation','')='' OR rotamapa_private.commercial_norm(entry->>'presentation')=rotamapa_private.commercial_norm(data->>'presentation'));
 RETURN coalesce(cardinality(candidates)=1 AND candidates[1]=product_id,false);
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.imported_entry_matches(uuid,uuid,jsonb,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.imported_entry_matches(uuid,uuid,jsonb,text) TO authenticated;

CREATE FUNCTION rotamapa_private.check_imported_campaign(who uuid,portfolio uuid,campaign jsonb) RETURNS void
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE original jsonb;entry jsonb;matching_entries jsonb;
BEGIN
 IF campaign->>'type' IS DISTINCT FROM 'importada' OR campaign#>'{imported,version}' IS DISTINCT FROM '1'::jsonb OR coalesce(campaign#>>'{imported,documentId}','') !~ '^[a-f0-9]{64}$' OR coalesce(campaign#>>'{imported,sourceHash}','') !~ '^[a-f0-9]{64}$' OR coalesce(length(btrim(campaign->>'name')),0) NOT BETWEEN 1 AND 160 OR campaign->'tiers' IS DISTINCT FROM '[]'::jsonb THEN RAISE EXCEPTION 'Origem da campanha importada inválida.'; END IF;
 IF (traxelo_private.portfolio_plan_access()->>'plan') NOT IN ('plus','pro') THEN RAISE EXCEPTION 'Campanhas importadas disponíveis nos planos Executivo e Elite.' USING ERRCODE='42501';END IF;
 SELECT data INTO original FROM public.rotamapa_library_items WHERE user_id=who AND portfolio_id=portfolio AND kind='campaigns' AND id=campaign#>>'{imported,documentId}' AND source_hash=campaign#>>'{imported,sourceHash}';
 IF original IS NULL OR jsonb_typeof(campaign#>'{imported,entries}') IS DISTINCT FROM 'array' OR jsonb_array_length(campaign#>'{imported,entries}') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Sincronize o documento original antes de usar a campanha.';END IF;
 IF coalesce(campaign->>'startDate','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(campaign->>'endDate','') !~ '^\d{4}-\d{2}-\d{2}$' OR (campaign->>'endDate')::date<(campaign->>'startDate')::date THEN RAISE EXCEPTION 'Vigência inválida.';END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(campaign#>'{imported,entries}') LOOP
  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(original->'entries') e WHERE e=entry) OR NOT rotamapa_private.imported_entry_matches(who,portfolio,entry,campaign->>'productId') OR (entry->>'validFrom')::date<(campaign->>'startDate')::date OR (entry->>'validTo')::date>(campaign->>'endDate')::date THEN RAISE EXCEPTION 'Preserve a apresentação e as condições do documento original.';END IF;
 END LOOP;
 -- Preserve order and multiplicity as well as every tier of this presentation.
 SELECT coalesce(jsonb_agg(e.value ORDER BY e.ordinality),'[]'::jsonb) INTO matching_entries FROM jsonb_array_elements(original->'entries') WITH ORDINALITY e(value,ordinality) WHERE rotamapa_private.imported_entry_matches(who,portfolio,e.value,campaign->>'productId');
 IF matching_entries IS DISTINCT FROM campaign#>'{imported,entries}' THEN RAISE EXCEPTION 'Inclua todas as faixas desta apresentação.';END IF;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.check_imported_campaign(uuid,uuid,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.check_imported_campaign(uuid,uuid,jsonb) TO authenticated;

CREATE FUNCTION rotamapa_private.imported_campaign_line(product jsonb,quantity bigint,campaign jsonb,sale_date date,context jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE entry jsonb;chosen jsonb;maximum bigint:=0;matches integer:=0;base bigint:=(product->>'priceCents')::bigint;unit_price bigint;bps bigint:=0;result jsonb;clock text:=coalesce(context->>'time','');region text:=coalesce(context->>'region','');
BEGIN
 IF context IS NULL OR jsonb_typeof(context)<>'object' OR length(region)>160 OR (clock<>'' AND clock !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') OR quantity NOT BETWEEN 1 AND 1000000 THEN RAISE EXCEPTION 'Confira quantidade, região e horário.';END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(campaign#>'{imported,entries}') LOOP
  IF sale_date NOT BETWEEN (entry->>'validFrom')::date AND (entry->>'validTo')::date OR (entry->>'minimum')::bigint>quantity THEN CONTINUE; END IF;
  IF coalesce(entry->>'restrictions','')<>'' THEN CONTINUE;END IF;
  IF coalesce(entry->>'region','')<>'' AND rotamapa_private.commercial_norm(entry->>'region')<>rotamapa_private.commercial_norm(region) THEN CONTINUE;END IF;
  IF coalesce(entry->>'startTime','')<>'' OR coalesce(entry->>'endTime','')<>'' THEN
   IF clock='' OR (coalesce(entry->>'startTime','')<>'' AND clock<entry->>'startTime') OR (coalesce(entry->>'endTime','')<>'' AND clock>entry->>'endTime') THEN CONTINUE;END IF;
  END IF;
  IF coalesce(entry->>'stock','')<>'' THEN
   IF entry->>'stock' !~ '^[0-9]+$' THEN CONTINUE; END IF;
   IF (entry->>'stock')::numeric<quantity THEN CONTINUE;END IF;
  END IF;
  IF (entry->>'minimum')::bigint>maximum THEN maximum:=(entry->>'minimum')::bigint;chosen:=entry;matches:=1;
  ELSIF (entry->>'minimum')::bigint=maximum THEN matches:=matches+1;END IF;
 END LOOP;
 IF matches<>1 THEN chosen:=NULL;maximum:=0;END IF;
 unit_price:=base;
 IF chosen IS NOT NULL THEN
  IF chosen->>'priceCents' IS NOT NULL THEN unit_price:=(chosen->>'priceCents')::bigint;IF unit_price NOT BETWEEN 1 AND base THEN RAISE EXCEPTION 'Confira o preço de oferta e a tabela.';END IF;bps:=((base-unit_price)*10000+base/2)/base;
  ELSE bps:=(chosen->>'discountBps')::bigint;IF bps NOT BETWEEN 0 AND 10000 THEN RAISE EXCEPTION 'Desconto inválido.';END IF;unit_price:=(base*(10000-bps)+5000)/10000;END IF;
 END IF;
 result:=jsonb_build_object('unitCents',unit_price,'totalCents',unit_price*quantity,'discountBps',bps,'minQty',maximum,'label',CASE WHEN chosen IS NULL THEN 'Preço de tabela' ELSE 'Campanha importada' END);
 IF chosen->>'priceCents' IS NOT NULL THEN result:=result||jsonb_build_object('unitPriceCents',unit_price);END IF;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.imported_campaign_line(jsonb,bigint,jsonb,date,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.imported_campaign_line(jsonb,bigint,jsonb,date,jsonb) TO authenticated;

-- Extend the installed validator only at explicitly checked anchors. No trigger or RLS bypass.
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_commerce()'::regprocedure);anchor text;
BEGIN
 anchor:='direct_mode boolean;';
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Validator declaration differs; review before migration.';END IF;
 source:=replace(source,anchor,anchor||' imported_expected jsonb;');
 anchor:='ELSIF new.kind=''campaign'' THEN';
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Campaign validator differs; review before migration.';END IF;
 source:=replace(source,anchor,anchor||E'\n  IF d->>''type''=''importada'' THEN PERFORM rotamapa_private.check_imported_campaign(new.user_id,new.portfolio_id,d); RETURN new;END IF;');
 anchor:='OR (d->>''date'')::date NOT BETWEEN (c->>''startDate'')::date AND (c->>''endDate'')::date';
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Campaign date guard differs; review before migration.';END IF;
 source:=replace(source,anchor,'OR (c->>''type''<>''importada'' AND (d->>''date'')::date NOT BETWEEN (c->>''startDate'')::date AND (c->>''endDate'')::date)');
 anchor:='FOR t IN SELECT value FROM jsonb_array_elements(c->''tiers'') LOOP';
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Line pricing differs; review before migration.';END IF;
 source:=replace(source,anchor,$insert$
    IF c->>'type'='importada' THEN
     IF (traxelo_private.portfolio_plan_access()->>'plan') NOT IN ('plus','pro') THEN RAISE EXCEPTION 'Campanhas importadas disponíveis nos planos Executivo e Elite.' USING ERRCODE='42501';END IF;
     imported_expected:=rotamapa_private.imported_campaign_line(p,qty,c,(d->>'date')::date,l->'promotionContext');
     IF (l->'unitPriceCents') IS DISTINCT FROM (imported_expected->'unitPriceCents') OR EXISTS(SELECT 1 FROM jsonb_each(imported_expected) e WHERE l->e.key IS DISTINCT FROM e.value) THEN RAISE EXCEPTION 'Preço da campanha importada divergente. Confira as condições e calcule novamente.';END IF;
     total:=total+(imported_expected->>'totalCents')::bigint;CONTINUE;
    END IF;
$insert$||anchor);
 EXECUTE source;
END;$migration$;
NOTIFY pgrst,'reload schema';
COMMIT;
