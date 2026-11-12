-- Synthetic membership removal through the existing RPC, in the disposable DB only.
BEGIN;
RESET ROLE;
INSERT INTO public.rotamapa_portfolios(user_id,id,name) VALUES
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000801','Exclusion fixture'),
 ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000802','Other owner fixture');
INSERT INTO public.clients(user_id,portfolio_id,local_id,name,data) VALUES
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000801','exclude-a','Client A','{"id":"exclude-a","name":"Client A","cnpj":"11222333000181","active":true,"lat":-5.8,"lon":-35.2,"locationVerification":"manual_reviewed"}'),
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000801','exclude-b','Client B','{"id":"exclude-b","name":"Client B","cnpj":"11444777000161","active":true,"address":"Preserve"}'),
 ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000802','exclude-other','Other owner','{"id":"exclude-other","name":"Other owner","cnpj":"11222333000181","active":true}');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000801"}',true);
DO $$DECLARE expected jsonb; original jsonb; payload jsonb; result jsonb; original_b jsonb; operation uuid:=gen_random_uuid(); BEGIN
 SELECT jsonb_agg(jsonb_build_object('id',local_id,'revision',revision) ORDER BY local_id),jsonb_agg(data ORDER BY local_id) INTO expected,original FROM public.clients;
 SELECT data INTO original_b FROM public.clients WHERE local_id='exclude-b';
 SELECT jsonb_agg(CASE WHEN value->>'id'='exclude-a' THEN value||'{"active":false}'::jsonb ELSE value END ORDER BY value->>'id') INTO payload FROM jsonb_array_elements(original);
 result:=public.rotamapa_replace_portfolio('00000000-0000-4000-8000-000000000801',operation,expected,payload,'Listed removals','synthetic.csv');
 PERFORM test.ensure((SELECT count(*)=2 FROM public.clients),'client rows must be retained');
 PERFORM test.ensure((SELECT data->>'active'='false' AND data->>'locationVerification'='manual_reviewed' AND (data->>'lat')::numeric=-5.8 FROM public.clients WHERE local_id='exclude-a'),'membership removed and pin retained');
 PERFORM test.ensure((SELECT data=original_b FROM public.clients WHERE local_id='exclude-b'),'unlisted client changed');
 PERFORM test.ensure((SELECT clients=original FROM public.rotamapa_portfolio_versions WHERE id=operation),'original membership not archived');
 result:=public.rotamapa_replace_portfolio('00000000-0000-4000-8000-000000000801',operation,expected,payload,'Retry','synthetic.csv');
 PERFORM test.ensure((result->>'replayed')::boolean,'retry should be idempotent');
 BEGIN
  PERFORM public.rotamapa_replace_portfolio('00000000-0000-4000-8000-000000000801',gen_random_uuid(),expected,original,'Stale restore','synthetic.csv');
  RAISE EXCEPTION 'stale revision accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN
  PERFORM public.rotamapa_replace_portfolio('00000000-0000-4000-8000-000000000802',gen_random_uuid(),expected,payload,'Wrong scope','synthetic.csv');
  RAISE EXCEPTION 'cross-account portfolio accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 PERFORM test.ensure((SELECT count(*)=1 FROM public.rotamapa_portfolio_versions WHERE portfolio_id='00000000-0000-4000-8000-000000000801'),'retry or conflicts created extra versions');
END$$;
RESET ROLE;
SELECT test.ensure((SELECT data->>'active'='true' FROM public.clients WHERE local_id='exclude-other'),'same CNPJ in other account changed');
ROLLBACK;
SELECT 'Portfolio exclusion assertions passed' AS result;
