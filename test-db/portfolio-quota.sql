-- Local disposable fixture only. Subscription quota is account-wide across portfolios.
BEGIN;
INSERT INTO public.traxelo_plan_grants(user_id,plan) VALUES('00000000-0000-4000-8000-000000000001','free');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
INSERT INTO public.rotamapa_portfolios(user_id,id,name) VALUES(auth.uid(),'90000000-0000-4000-8000-000000000001','Outra carteira');
DO $$DECLARE payload jsonb:='{"name":"Rota teste","points":[{"lat":-5.8,"lon":-35.2}],"start":{"lat":-5.81,"lon":-35.21}}';BEGIN
 PERFORM public.traxelo_write_owned_item(auth.uid(),gen_random_uuid(),'route',payload,0);
 PERFORM set_config('request.headers','{"x-rotamapa-portfolio":"90000000-0000-4000-8000-000000000001"}',true);
 PERFORM public.traxelo_write_owned_item(auth.uid(),gen_random_uuid(),'route',payload,0);
 PERFORM public.traxelo_write_owned_item(auth.uid(),gen_random_uuid(),'route',payload,0);
 PERFORM test.ensure((public.traxelo_plan_access()->>'routeCount')::integer=3,'quota was scoped to one wallet');
 PERFORM test.ensure((select count(*)=2 from public.traxelo_workspace_items),'route read leaked across wallets');
 BEGIN PERFORM public.traxelo_write_owned_item(auth.uid(),gen_random_uuid(),'route',payload,0);RAISE EXCEPTION 'QUOTA BYPASS';EXCEPTION WHEN raise_exception THEN IF SQLERRM='QUOTA BYPASS' THEN RAISE;END IF;END;
END;$$;
ROLLBACK;
