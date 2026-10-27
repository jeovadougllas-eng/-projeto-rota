-- Transactional probes only. All synthetic users and routes are rolled back by the caller.
insert into auth.users(id) values('e64d0db2-f5d8-461a-8799-194d405bfda1'),('e64d0db2-f5d8-461a-8799-194d405bfda2');
insert into public.traxelo_plan_grants(user_id,plan) values('e64d0db2-f5d8-461a-8799-194d405bfda1','free');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e64d0db2-f5d8-461a-8799-194d405bfda1","is_anonymous":false}',true);
do $$declare payload jsonb:='{"name":"Synthetic route","start":{"id":null,"lat":-5.8,"lon":-35.2},"points":[{"id":"fixture","lat":-5.81,"lon":-35.21}],"favorite":false}';r jsonb;begin
 if public.traxelo_plan_access()->>'plan'<>'free' then raise exception 'Explicit Free grant ignored';end if;
 for i in 1..3 loop perform public.traxelo_write_owned_item(auth.uid(),('e64d0db2-f5d8-461a-8799-'||lpad(i::text,12,'0'))::uuid,'route',payload,0);end loop;
 begin perform public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000004','route',payload,0);raise exception 'QUOTA BYPASS';exception when raise_exception then if sqlerrm='QUOTA BYPASS' then raise;end if;end;
 begin insert into public.traxelo_workspace_items(user_id,id,kind,data) values(auth.uid(),gen_random_uuid(),'route',payload);raise exception 'DIRECT WRITE BYPASS';exception when insufficient_privilege then null;end;
 begin update public.traxelo_plan_grants set plan='pro';raise exception 'SELF UPGRADE BYPASS';exception when insufficient_privilege then null;end;
 begin update public.traxelo_release_access set beta_pro=false;raise exception 'CONFIG WRITE BYPASS';exception when insufficient_privilege then null;end;
 begin perform public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000001','route',payload,0);raise exception 'STALE REVISION BYPASS';exception when serialization_failure then null;end;
 begin perform public.traxelo_write_owned_item(auth.uid(),gen_random_uuid(),'schedule','{"title":"Test","targetType":"client","targetId":"fixture","startDate":"2026-11-01","repeat":"weekly"}',0);raise exception 'FREE AGENDA BYPASS';exception when insufficient_privilege then null;end;
 begin perform public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000001','route',jsonb_set(payload,'{favorite}','true'),1);raise exception 'FREE FAVORITE BYPASS';exception when insufficient_privilege then null;end;
end;$$;
reset role;
update public.traxelo_plan_grants set plan='plus' where user_id='e64d0db2-f5d8-461a-8799-194d405bfda1';
set local role authenticated;
do $$declare payload jsonb:='{"name":"Synthetic route","start":{"lat":-5.8,"lon":-35.2},"points":[{"id":"fixture","lat":-5.81,"lon":-35.21}]}';begin
 for i in 4..20 loop perform public.traxelo_write_owned_item(auth.uid(),('e64d0db2-f5d8-461a-8799-'||lpad(i::text,12,'0'))::uuid,'route',payload,0);end loop;
 begin perform public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000021','route',payload,0);raise exception 'PLUS QUOTA BYPASS';exception when raise_exception then if sqlerrm='PLUS QUOTA BYPASS' then raise;end if;end;
 perform public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000030','schedule','{"title":"Test","targetType":"client","targetId":"fixture","startDate":"2026-11-01","repeat":"weekly"}',0);
 begin perform public.traxelo_write_owned_item(auth.uid(),gen_random_uuid(),'settings','{"visitSettings":{"monthlyTarget":100}}',0);raise exception 'PLUS FORECAST BYPASS';exception when insufficient_privilege then null;end;
end;$$;
reset role;
update public.traxelo_plan_grants set plan='pro' where user_id='e64d0db2-f5d8-461a-8799-194d405bfda1';
set local role authenticated;
select public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000021','route','{"name":"Pro 21","start":{"lat":-5.8,"lon":-35.2},"points":[{"lat":-5.81,"lon":-35.21}]}',0)->>'revision' as pro_21_saved;
reset role;
update public.traxelo_plan_grants set plan='free' where user_id='e64d0db2-f5d8-461a-8799-194d405bfda1';
set local role authenticated;
do $$begin
 if(select count(*) from public.traxelo_workspace_items where kind='route' and not deleted)<>21 then raise exception 'DOWNGRADE DATA LOSS';end if;
 perform public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000001','route','{"name":"Renamed after downgrade","start":{"lat":-5.8,"lon":-35.2},"points":[{"lat":-5.81,"lon":-35.21}]}',1);
end;$$;
select set_config('request.jwt.claims','{"sub":"e64d0db2-f5d8-461a-8799-194d405bfda2","is_anonymous":false}',true);
do $$begin
 if exists(select 1 from public.traxelo_workspace_items) then raise exception 'CROSS ACCOUNT READ';end if;
 if exists(select 1 from public.traxelo_plan_grants) then raise exception 'CROSS ACCOUNT PLAN';end if;
 begin perform public.traxelo_write_owned_item('e64d0db2-f5d8-461a-8799-194d405bfda1',gen_random_uuid(),'route','{}',0);raise exception 'SESSION SWITCH OWNER BYPASS';exception when insufficient_privilege then null;end;
 begin perform public.traxelo_write_owned_item(auth.uid(),'e64d0db2-f5d8-461a-8799-000000000001','route','{}',2);raise exception 'CROSS ACCOUNT UPDATE';exception when serialization_failure then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"e64d0db2-f5d8-461a-8799-194d405bfda1","is_anonymous":true}',true);
do $$begin
 if exists(select 1 from public.traxelo_workspace_items) then raise exception 'ANONYMOUS READ';end if;
 begin perform public.traxelo_plan_access();raise exception 'ANONYMOUS ACCESS';exception when insufficient_privilege then null;end;
end;$$;
reset role;
set local role anon;
do $$begin
 begin perform public.traxelo_plan_access();raise exception 'UNAUTHENTICATED ACCESS';exception when insufficient_privilege then null;end;
 begin perform * from public.traxelo_workspace_items;raise exception 'UNAUTHENTICATED READ';exception when insufficient_privilege then null;end;
end;$$;
reset role;
select 'Passed: Free 3 / Plus 20 / Pro 21+, RLS, CAS, ownership, downgrade, agenda, nested goal gate, grants and anonymous rejection' as premium_verified;
