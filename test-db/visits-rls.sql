SET ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}',false);
INSERT INTO public.traxelo_visit_events(user_id,id,client_id,visit_date,status,data)
VALUES(auth.uid(),'00000000-0000-4000-8000-000000000010','client-original-id','2026-10-01','confirmed','{"id":"00000000-0000-4000-8000-000000000010","clientId":"client-original-id","visitDate":"2026-10-01","status":"confirmed"}');
SELECT test.ensure((SELECT count(*)=1 FROM public.traxelo_visit_events),'owner can read inserted visit');
UPDATE public.traxelo_visit_events SET data=jsonb_set(data,'{status}','"void"'),status='void',revision=revision+1 WHERE id='00000000-0000-4000-8000-000000000010' AND revision=1;
SELECT test.ensure((SELECT revision=2 AND status='void' FROM public.traxelo_visit_events LIMIT 1),'owner can soft-void using revision CAS');
UPDATE public.traxelo_visit_events SET revision=revision+1 WHERE id='00000000-0000-4000-8000-000000000010' AND revision=1;
SELECT test.ensure((SELECT revision=2 FROM public.traxelo_visit_events LIMIT 1),'stale CAS does not overwrite');
DO $$ BEGIN
 BEGIN UPDATE public.traxelo_visit_events SET user_id='00000000-0000-4000-8000-000000000002';RAISE EXCEPTION 'owner reassignment was allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO public.traxelo_visit_events(user_id,id,client_id,visit_date,status,data) VALUES('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000011','c','2026-10-01','confirmed','{"id":"00000000-0000-4000-8000-000000000011","clientId":"c","visitDate":"2026-10-01","status":"confirmed"}');RAISE EXCEPTION 'cross-owner insert was allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE public.traxelo_visit_events SET status='confirmed';RAISE EXCEPTION 'inconsistent JSON was allowed';EXCEPTION WHEN check_violation THEN NULL;END;
END; $$;
INSERT INTO storage.objects(bucket_id,name) VALUES('traxelo-visit-exports',auth.uid()::text||'/visitas/test.xlsx');
SELECT test.ensure((SELECT count(*)=1 FROM storage.objects),'owner sees private export');
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}',false);
SELECT test.ensure((SELECT count(*)=0 FROM public.traxelo_visit_events),'another owner cannot read visits');
SELECT test.ensure((SELECT count(*)=0 FROM storage.objects),'another owner cannot read exports');
DELETE FROM storage.objects;
DO $$ BEGIN
 BEGIN INSERT INTO storage.objects(bucket_id,name) VALUES('traxelo-visit-exports','00000000-0000-4000-8000-000000000001/visitas/foreign.xlsx');RAISE EXCEPTION 'foreign folder write allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END;$$;
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":true}',false);
SELECT test.ensure((SELECT count(*)=0 FROM public.traxelo_visit_events),'anonymous user cannot read owner history');
SELECT test.ensure((SELECT count(*)=0 FROM storage.objects),'anonymous user cannot read exports');
SET ROLE anon;
DO $$ BEGIN BEGIN PERFORM * FROM public.traxelo_visit_events;RAISE EXCEPTION 'unauthenticated read allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END;$$;
RESET ROLE;
SELECT test.ensure((SELECT NOT public FROM storage.buckets WHERE id='traxelo-visit-exports'),'export bucket is private');
SELECT test.ensure((SELECT count(*)=1 FROM storage.objects),'foreign owner could not delete export');
SELECT 'RLS, owner isolation, CAS and private export policies verified in isolated Postgres' AS result;
