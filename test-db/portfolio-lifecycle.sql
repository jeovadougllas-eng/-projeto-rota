-- Local synthetic data only. Exercises the actual existing migrations and their triggers.
INSERT INTO public.rotamapa_portfolios(user_id,id,name) VALUES('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','Carteira teste'),('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000102','Outra conta');
INSERT INTO public.clients(user_id,portfolio_id,local_id,name,data) VALUES('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','synthetic','Preservar pin','{"lat":-5.8,"lon":-35.2,"locationVerification":"manual_reviewed"}');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000101"}',false);
SELECT public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000101',1,'archive','ARQUIVAR Carteira teste');
SELECT test.ensure((SELECT count(*)=1 FROM public.clients),'archive retains data');
DO $$BEGIN
 BEGIN UPDATE public.clients SET name='stale device';RAISE EXCEPTION 'stale device wrote archived data';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000102',1,'delete','EXCLUIR Outra conta');RAISE EXCEPTION 'cross-owner deletion allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000101',1,'restore','RESTAURAR Carteira teste');RAISE EXCEPTION 'stale revision allowed';EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN PERFORM public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000101',2,'delete','wrong');RAISE EXCEPTION 'weak confirmation allowed';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
END$$;
SELECT public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000101',2,'restore','RESTAURAR Carteira teste');
SELECT test.ensure((SELECT name='Preservar pin' AND data->>'locationVerification'='manual_reviewed' FROM public.clients),'restoration retains exact client and pin');
SELECT public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000101',3,'delete','EXCLUIR Carteira teste');
SELECT test.ensure((SELECT count(*)=0 FROM public.clients),'permanent deletion removes only selected portfolio records');
DO $$BEGIN
 BEGIN INSERT INTO public.clients(user_id,portfolio_id,local_id,name,data) VALUES(auth.uid(),'00000000-0000-4000-8000-000000000101','synthetic','stale','{}');RAISE EXCEPTION 'stale device resurrected deleted client';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000101',4,'restore','RESTAURAR Carteira excluída');RAISE EXCEPTION 'permanent deletion restored';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END$$;
SELECT set_config('request.headers','{}',false);
SELECT test.ensure((SELECT count(*)=1 FROM public.clients),'other portfolio preserved');
SELECT public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000000',1,'delete','EXCLUIR Carteira inicial');
DO $$BEGIN BEGIN INSERT INTO public.clients(user_id,local_id,name,data) VALUES(auth.uid(),'old-default','Old device','{}');RAISE EXCEPTION 'default portfolio resurrected';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END$$;
SELECT test.ensure((public.traxelo_plan_access()->>'portfolioCount')::int=0,'deleted tombstones do not consume quota');
RESET ROLE;
SELECT test.ensure((SELECT count(*)=1 FROM public.rotamapa_portfolios WHERE user_id='00000000-0000-4000-8000-000000000002'),'other user preserved');
SELECT test.ensure((SELECT count(*)=2 FROM rotamapa_private.portfolio_lifecycle WHERE state='deleted'),'permanent tombstones retained');
SELECT 'All portfolio lifecycle database assertions passed' AS result;
