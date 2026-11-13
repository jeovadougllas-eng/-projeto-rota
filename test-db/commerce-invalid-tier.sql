begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"is_anonymous":false}',true);
do $$declare invalid jsonb; rejected boolean:=false;
begin
 select jsonb_build_object('id','30000000-0000-4000-8000-000000000002','kind','sale','clientId','client-a','date','2026-10-29','status','confirmed','lines',jsonb_build_array(jsonb_build_object('productId','10000000-0000-4000-8000-000000000001','name','Produto teste','quantity',17,'tableUnitCents',3000,'discountBps',1000,'minQty',18,'label','Faixa 2','unitCents',2700,'totalCents',45900,'campaign',data)),'totalCents',45900) into invalid from public.rotamapa_commerce_items where kind='campaign';
 begin
  insert into public.rotamapa_commerce_items(user_id,id,kind,data) values(auth.uid(),'30000000-0000-4000-8000-000000000002','sale',invalid);
 exception when raise_exception then
  if sqlerrm not like 'Cálculo inválido%' then raise;end if;rejected:=true;
 end;
 if not rejected then raise exception 'Server accepted a tier that was not reached';end if;
end;$$;
rollback;
