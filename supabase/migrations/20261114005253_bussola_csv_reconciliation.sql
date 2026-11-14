-- Additive Bússola snapshots. Original sales, revisions, RLS and PDF quotas remain protected.
BEGIN;
CREATE FUNCTION rotamapa_private.check_bussola(o jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE i jsonb;k text;seen text[]:='{}';gross bigint:=0;net bigint:=0;requested bigint:=0;
BEGIN
 IF jsonb_typeof(o) IS DISTINCT FROM 'object' OR o->'version' IS DISTINCT FROM '1'::jsonb OR o->'reviewed' IS DISTINCT FROM 'true'::jsonb OR coalesce(o->>'orderNumber','') !~ '^[0-9]{1,30}$' OR coalesce(o->>'cnpj','') !~ '^[0-9]{14}$' OR coalesce(length(btrim(o->>'distributor')),0) NOT BETWEEN 1 AND 80 OR coalesce(o->>'status','') NOT IN ('Faturado','Faturado Parcial','Atendido','Atendido Parcial','Cancelado') OR coalesce(o->>'requestDate','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR coalesce(o->>'importDate','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR coalesce(o->>'invoiceNumber','') !~ '^[A-Za-z0-9_./-]{0,80}$' OR coalesce(o->>'fileHash','') !~ '^[a-f0-9]{64}$' OR jsonb_typeof(o->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(o->'items') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Bussola snapshot invalid';END IF;
 PERFORM (o->>'requestDate')::date;PERFORM (o->>'importDate')::date;
 IF (o->>'requestDate')::date>(now() AT TIME ZONE 'America/Fortaleza')::date OR (o->>'importDate')::date>(now() AT TIME ZONE 'America/Fortaleza')::date THEN RAISE EXCEPTION 'Bussola date in future';END IF;
 FOR i IN SELECT value FROM jsonb_array_elements(o->'items') LOOP
  IF coalesce(i->>'ean','') !~ '^[0-9]{13,14}$' OR (i->>'ean')=ANY(seen) OR coalesce(length(btrim(i->>'description')),0) NOT BETWEEN 1 AND 500 OR coalesce(length(i->>'sku'),81)>80 OR coalesce(i->>'productId','') !~ '^[a-f0-9-]{36}$' THEN RAISE EXCEPTION 'Bussola product invalid or repeated';END IF;
  seen:=array_append(seen,i->>'ean');
  FOREACH k IN ARRAY ARRAY['requested','attended','invoiced','cancelled','grossUnitCents','netUnitCents','netBilledCents'] LOOP
   IF jsonb_typeof(i->k) IS DISTINCT FROM 'number' OR coalesce(i->>k,'') !~ '^[0-9]+$' OR (i->>k)::numeric>9000000000000 THEN RAISE EXCEPTION 'Bussola numeric field invalid';END IF;
  END LOOP;
  IF (i->>'requested')::bigint NOT BETWEEN 1 AND 1000000 OR (i->>'attended')::bigint>(i->>'requested')::bigint OR (i->>'invoiced')::bigint>(i->>'requested')::bigint OR (i->>'cancelled')::bigint>(i->>'requested')::bigint OR (i->>'grossUnitCents')::bigint>1000000000 OR (i->>'netUnitCents')::bigint>1000000000 OR (i->>'netBilledCents')::bigint<>(i->>'invoiced')::bigint*(i->>'netUnitCents')::bigint THEN RAISE EXCEPTION 'Bussola quantities or prices invalid';END IF;
  gross:=gross+(i->>'invoiced')::bigint*(i->>'grossUnitCents')::bigint;net:=net+(i->>'netBilledCents')::bigint;requested:=requested+(i->>'requested')::bigint*(i->>'grossUnitCents')::bigint;
 END LOOP;
 IF o->>'grossBilledCents' IS DISTINCT FROM gross::text OR o->>'netBilledCents' IS DISTINCT FROM net::text OR o->>'requestedCents' IS DISTINCT FROM requested::text OR greatest(gross,net,requested)>9000000000000 OR ((gross>0) IS DISTINCT FROM (o->>'status' IN ('Faturado','Faturado Parcial'))) THEN RAISE EXCEPTION 'Bussola totals or status invalid';END IF;
 IF gross>0 THEN
  IF coalesce(o->>'invoiceDate','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR o->>'invoiceNumber'='' OR (o->>'invoiceDate')::date>(now() AT TIME ZONE 'America/Fortaleza')::date THEN RAISE EXCEPTION 'Bussola invoice invalid';END IF;
 END IF;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.check_bussola(jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.check_bussola(jsonb) TO authenticated;
CREATE FUNCTION rotamapa_private.validate_bussola() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE o jsonb:=new.data->'bussola';original jsonb;item jsonb;line jsonb;prod jsonb;idx integer:=0;
BEGIN
 IF auth.uid() IS DISTINCT FROM new.user_id OR coalesce(auth.jwt()->>'is_anonymous','false')='true' OR new.portfolio_id IS DISTINCT FROM public.rotamapa_current_portfolio() THEN RAISE EXCEPTION 'Account or portfolio invalid' USING ERRCODE='42501';END IF;
 IF new.kind<>'sale' OR new.data->>'status'<>'confirmed' OR new.data->>'id' IS DISTINCT FROM new.id::text OR coalesce(length(new.data->>'clientId'),0) NOT BETWEEN 1 AND 250 THEN RAISE EXCEPTION 'Bussola sale invalid';END IF;
 PERFORM rotamapa_private.check_bussola(o);
 IF TG_OP='INSERT' THEN
  IF new.revision<>1 OR new.data#>>'{source,type}' IS DISTINCT FROM 'bussola_csv' OR new.data#>'{source,version}' IS DISTINCT FROM '1'::jsonb OR new.data#>'{source,reviewed}' IS DISTINCT FROM 'true'::jsonb OR new.data#>'{source,order}' IS DISTINCT FROM o OR coalesce(new.data->'bussolaHistory','[]'::jsonb)<>'[]'::jsonb OR new.data ? 'manualBilling' OR new.data ? 'settlements' OR new.data ? 'visitId' THEN RAISE EXCEPTION 'Bussola original invalid';END IF;
  original:=o;
  IF new.data->>'date' IS DISTINCT FROM o->>'requestDate' OR new.data->>'totalCents' IS DISTINCT FROM o->>'requestedCents' OR jsonb_typeof(new.data->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(new.data->'lines')<>jsonb_array_length(o->'items') THEN RAISE EXCEPTION 'Bussola original items invalid';END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(o->'items') LOOP
   line:=new.data->'lines'->idx;
   SELECT data INTO prod FROM public.rotamapa_commerce_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND kind='product' AND id::text=item->>'productId';
   IF prod IS NULL OR coalesce((prod->>'disabled')::boolean,false) OR line->>'productId' IS DISTINCT FROM item->>'productId' OR line->>'name' IS DISTINCT FROM prod->>'name' OR line->>'tableUnitCents' IS DISTINCT FROM prod->>'priceCents' OR line->>'quantity' IS DISTINCT FROM item->>'requested' OR line->>'unitCents' IS DISTINCT FROM item->>'grossUnitCents' OR line->>'totalCents' IS DISTINCT FROM ((item->>'requested')::bigint*(item->>'grossUnitCents')::bigint)::text THEN RAISE EXCEPTION 'Bussola original line mismatch';END IF;idx:=idx+1;
  END LOOP;
 ELSE
  IF new.user_id<>old.user_id OR new.portfolio_id<>old.portfolio_id OR new.id<>old.id OR new.kind<>old.kind OR new.revision<>old.revision+1 OR (new.data-ARRAY['bussola','bussolaHistory','version','updatedAt']) IS DISTINCT FROM (old.data-ARRAY['bussola','bussolaHistory','version','updatedAt']) THEN RAISE EXCEPTION 'Preserve original sale and revision' USING ERRCODE='40001';END IF;
  IF old.data ? 'bussola' AND (o->>'cnpj' IS DISTINCT FROM old.data#>>'{bussola,cnpj}' OR o->>'orderNumber' IS DISTINCT FROM old.data#>>'{bussola,orderNumber}') THEN RAISE EXCEPTION 'Preserve Bussola identity';END IF;
  IF old.data ? 'source' AND old.data#>>'{source,type}'<>'bussola_csv' THEN
   IF jsonb_array_length(old.data#>'{source,receipts}')<>1 OR old.data#>>'{source,receipts,0,cnpj}' IS DISTINCT FROM o->>'cnpj' OR old.data#>>'{source,receipts,0,orderNumber}' IS DISTINCT FROM o->>'orderNumber' THEN RAISE EXCEPTION 'Bussola does not match original PDF order';END IF;
  END IF;
  IF jsonb_typeof(new.data->'bussolaHistory') IS DISTINCT FROM 'array' OR jsonb_array_length(new.data->'bussolaHistory')>10 OR new.data->'bussolaHistory' IS DISTINCT FROM (coalesce(old.data->'bussolaHistory','[]'::jsonb)||CASE WHEN old.data ? 'bussola' THEN jsonb_build_array(old.data->'bussola') ELSE '[]'::jsonb END) THEN RAISE EXCEPTION 'Preserve Bussola prior revisions';END IF;
 END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(o->'items') LOOP
  SELECT data INTO prod FROM public.rotamapa_commerce_items WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND kind='product' AND id::text=item->>'productId';
  IF prod IS NULL OR (nullif(prod->>'ean','') IS NOT NULL AND prod->>'ean'<>item->>'ean') THEN RAISE EXCEPTION 'Bussola product identity mismatch';END IF;
 END LOOP;
 PERFORM pg_advisory_xact_lock(hashtextextended(new.user_id::text||':'||new.portfolio_id::text||':external_orders',0));
 IF EXISTS(SELECT 1 FROM public.rotamapa_commerce_items x WHERE x.user_id=new.user_id AND x.portfolio_id=new.portfolio_id AND x.kind='sale' AND x.id<>new.id AND ((x.data#>>'{bussola,orderNumber}'=o->>'orderNumber' AND x.data#>>'{bussola,cnpj}'=o->>'cnpj') OR EXISTS(SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(x.data#>'{source,receipts}')='array' THEN x.data#>'{source,receipts}' ELSE '[]'::jsonb END) r WHERE r->>'orderNumber'=o->>'orderNumber' AND r->>'cnpj'=o->>'cnpj'))) THEN RAISE EXCEPTION 'External order already linked in this portfolio' USING ERRCODE='23505';END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.validate_bussola() FROM public,anon,authenticated;
-- Route only validated CSV snapshots through the additive validator. All original code remains intact.
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_commerce()'::regprocedure);anchor text;
BEGIN
 anchor:=E'BEGIN\n';IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Commerce function shape differs';END IF;
 -- A separate trigger validates the additive fields first; this branch can only return after its checks.
 source:=overlay(source placing anchor||E' IF new.kind=''sale'' AND (new.data ? ''bussola'' OR (TG_OP=''UPDATE'' AND old.data ? ''bussola'') OR new.data#>>''{source,type}''=''bussola_csv'') THEN RETURN new;END IF;\n' from strpos(source,anchor) for length(anchor));
 EXECUTE source;
END;$migration$;
CREATE TRIGGER aab_bussola_validate BEFORE INSERT OR UPDATE ON public.rotamapa_commerce_items FOR EACH ROW WHEN(new.kind='sale') EXECUTE FUNCTION rotamapa_private.validate_bussola();
-- Make the trigger a no-op for records that have never used Bússola.
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_bussola()'::regprocedure);anchor text:=E'BEGIN\n';
BEGIN source:=overlay(source placing anchor||E' IF NOT(coalesce(new.data ? ''bussola'' OR (TG_OP=''UPDATE'' AND old.data ? ''bussola'') OR new.data#>>''{source,type}''=''bussola_csv'',false)) THEN
 IF jsonb_typeof(new.data#>''{source,receipts}'')=''array'' THEN
  PERFORM pg_advisory_xact_lock(hashtextextended(new.user_id::text||'':''||new.portfolio_id::text||'':external_orders'',0));
  FOR item IN SELECT value FROM jsonb_array_elements(new.data#>''{source,receipts}'') LOOP
   IF EXISTS(SELECT 1 FROM public.rotamapa_commerce_items x WHERE x.user_id=new.user_id AND x.portfolio_id=new.portfolio_id AND x.id<>new.id AND x.data#>>''{bussola,orderNumber}''=item->>''orderNumber'' AND x.data#>>''{bussola,cnpj}''=item->>''cnpj'') THEN RAISE EXCEPTION ''Order already imported via Bussola'' USING ERRCODE=''23505'';END IF;
  END LOOP;
 END IF;
 RETURN new;END IF;\n' from strpos(source,anchor) for length(anchor));EXECUTE source;END;$migration$;
-- CSV is not a PDF import and must not consume a PDF quota.
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.invoice_pdf_usage()'::regprocedure);anchor text:=E'BEGIN\n';
BEGIN source:=overlay(source placing anchor||E' IF new.data#>>''{source,type}''=''bussola_csv'' THEN RETURN new;END IF;\n' from strpos(source,anchor) for length(anchor));EXECUTE source;END;$migration$;
CREATE UNIQUE INDEX rotamapa_bussola_external_order ON public.rotamapa_commerce_items(user_id,portfolio_id,(data#>>'{bussola,cnpj}'),(data#>>'{bussola,orderNumber}')) WHERE kind='sale' AND data ? 'bussola';
NOTIFY pgrst,'reload schema';
COMMIT;
