BEGIN;
INSERT INTO public.rotamapa_portfolios(user_id,id,name) VALUES('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000777','Sale visits fixture');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT set_config('request.jwt.claims','{"is_anonymous":false}',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000777"}',false);
SET ROLE authenticated;
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data) VALUES
(auth.uid(),public.rotamapa_current_portfolio(),'66000000-0000-4000-8000-000000000001','product','{"id":"66000000-0000-4000-8000-000000000001","kind":"product","name":"Produto sintético","priceCents":1000}');
INSERT INTO public.rotamapa_commerce_items(user_id,portfolio_id,id,kind,data) VALUES
(auth.uid(),public.rotamapa_current_portfolio(),'66000000-0000-4000-8000-000000000002','sale','{"id":"66000000-0000-4000-8000-000000000002","kind":"sale","clientId":"fixture-client","clientName":"Cliente sintético","date":"2026-11-10","status":"confirmed","totalCents":1000,"automaticVisitVersion":1,"automaticVisitRegisteredAt":"2026-11-16T12:00:00Z","lines":[{"productId":"66000000-0000-4000-8000-000000000001","name":"Produto sintético","quantity":1,"tableUnitCents":1000,"unitCents":1000,"discountBps":0,"minQty":0,"label":"Preço de tabela","totalCents":1000,"campaign":null}]}');
SELECT test.ensure((SELECT (data->>'automaticVisitVersion')::int=1 AND data->>'status'='confirmed' FROM public.rotamapa_commerce_items WHERE kind='sale'),'new sale metadata persists');
UPDATE public.rotamapa_commerce_items SET data=data||'{"status":"cancelled","cancelReason":"Synthetic cancellation"}',revision=revision+1 WHERE kind='sale';
SELECT test.ensure((SELECT data->>'status'='cancelled' AND data->>'automaticVisitVersion'='1' FROM public.rotamapa_commerce_items WHERE kind='sale'),'cancellation preserves marker without violating immutable fields');
SELECT test.ensure((SELECT count(*)=0 FROM public.traxelo_visit_events),'sale metadata never fabricates physical visit rows');
RESET ROLE;
ROLLBACK;
SELECT 'Sale-backed visit metadata is compatible with RLS and sale cancellation without physical writes' AS result;
