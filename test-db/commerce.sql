-- Isolated Postgres only. Synthetic owners and prices.
insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
create schema test_commerce;
create function test_commerce.ensure(ok boolean,msg text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception '%',msg;end if;end;$$;
grant usage on schema test_commerce to authenticated,anon;
grant execute on function test_commerce.ensure(boolean,text) to authenticated,anon;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
insert into public.rotamapa_commerce_items(user_id,id,kind,data) values
(auth.uid(),'10000000-0000-4000-8000-000000000001','product','{"id":"10000000-0000-4000-8000-000000000001","kind":"product","name":"Produto teste","priceCents":2000}'),
(auth.uid(),'20000000-0000-4000-8000-000000000001','campaign','{"id":"20000000-0000-4000-8000-000000000001","kind":"campaign","name":"Campanha teste","type":"dia_d","productId":"10000000-0000-4000-8000-000000000001","startDate":"2026-10-29","endDate":"2026-10-29","tiers":[{"label":"Faixa 1","minQty":6,"discountBps":500},{"label":"Faixa 2","minQty":18,"discountBps":1000}]}');
insert into public.rotamapa_commerce_items(user_id,id,kind,data)
select auth.uid(),'30000000-0000-4000-8000-000000000001','sale',jsonb_build_object('id','30000000-0000-4000-8000-000000000001','kind','sale','clientId','client-a','date','2026-10-29','status','confirmed','lines',jsonb_build_array(jsonb_build_object('productId','10000000-0000-4000-8000-000000000001','name','Produto teste','quantity',17,'tableUnitCents',2000,'discountBps',500,'minQty',6,'label','Faixa 1','unitCents',1900,'totalCents',32300,'campaign',data)),'totalCents',32300) from public.rotamapa_commerce_items where kind='campaign';
select test_commerce.ensure((select count(*)=3 from public.rotamapa_commerce_items),'owner read');
do $$begin begin update public.rotamapa_commerce_items set revision=revision+1,data=jsonb_set(data,'{totalCents}','1') where kind='sale';raise exception 'tamper accepted';exception when sqlstate '22023' then null;end;end;$$;
update public.rotamapa_commerce_items set revision=revision+1,data=jsonb_set(data,'{priceCents}','3000') where kind='product';
update public.rotamapa_commerce_items set revision=revision+1,data=data||'{"status":"cancelled","cancelReason":"teste"}' where kind='sale';
select test_commerce.ensure((select data->'lines'->0->>'unitCents'='1900' from public.rotamapa_commerce_items where kind='sale'),'historic price preserved');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
select test_commerce.ensure((select count(*)=0 from public.rotamapa_commerce_items),'other owner cannot read');
update public.rotamapa_commerce_items set data='{}',revision=revision+1;
do $$begin begin insert into public.rotamapa_commerce_items(user_id,id,kind,data) values('00000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000001','product','{"id":"90000000-0000-4000-8000-000000000001","kind":"product","name":"Forbidden","priceCents":1}');raise exception 'cross account accepted';exception when insufficient_privilege then null;end;end;$$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
select set_config('request.jwt.claims','{"is_anonymous":true}',false);
select test_commerce.ensure((select count(*)=0 from public.rotamapa_commerce_items),'anonymous auth cannot read');
reset role;
select test_commerce.ensure(not has_table_privilege('anon','public.rotamapa_commerce_items','select'),'anon has no access');
select test_commerce.ensure((select data->>'totalCents'='32300' from public.rotamapa_commerce_items where kind='sale'),'tamper never modified amount');
