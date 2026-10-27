-- Additive release. Existing clients and visit events are untouched.
begin;
create schema if not exists traxelo_private;
revoke all on schema traxelo_private from public;
grant usage on schema traxelo_private to authenticated;
create table public.traxelo_release_access (
 singleton boolean primary key default true check(singleton), beta_pro boolean not null default true
);
insert into public.traxelo_release_access values(true,true);
alter table public.traxelo_release_access enable row level security;
create policy release_read on public.traxelo_release_access for select to authenticated using(coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
create table public.traxelo_plan_grants (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null check(plan in ('free','plus','pro')), expires_at timestamptz
);
alter table public.traxelo_plan_grants enable row level security;
create policy own_plan on public.traxelo_plan_grants for select to authenticated using((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
create table public.traxelo_workspace_items (
 user_id uuid not null references auth.users(id) on delete cascade,
 id uuid not null, kind text not null check(kind in ('route','schedule','settings')),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=524288),
 revision bigint not null default 1 check(revision>0), deleted boolean not null default false,
 updated_at timestamptz not null default now(), primary key(user_id,id)
);
alter table public.traxelo_workspace_items enable row level security;
create policy own_workspace on public.traxelo_workspace_items for select to authenticated using((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
create index traxelo_workspace_kind on public.traxelo_workspace_items(user_id,kind) where not deleted;
revoke all on public.traxelo_release_access,public.traxelo_plan_grants,public.traxelo_workspace_items from anon,authenticated;
grant select on public.traxelo_release_access,public.traxelo_plan_grants,public.traxelo_workspace_items to authenticated;
grant all on public.traxelo_release_access,public.traxelo_plan_grants,public.traxelo_workspace_items to service_role;
create function public.traxelo_plan_access() returns jsonb language plpgsql security invoker set search_path='' as $$
declare who uuid:=auth.uid(); tier text; beta boolean; count_routes integer;
begin
 if who is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Entre na sua conta.' using errcode='42501'; end if;
 select plan into tier from public.traxelo_plan_grants where user_id=who and (expires_at is null or expires_at>now());
 select beta_pro into beta from public.traxelo_release_access where singleton;
 -- Explicit grants take priority, allowing realistic Free/Plus QA without changing global beta.
 tier:=coalesce(tier,case when beta then 'pro' else 'free' end);
 select count(*) into count_routes from public.traxelo_workspace_items where user_id=who and kind='route' and not deleted;
 return jsonb_build_object('plan',tier,'beta',coalesce(beta,false),'routeLimit',case tier when 'free' then 3 when 'plus' then 20 else null end,'routeCount',count_routes);
end;$$;
revoke all on function public.traxelo_plan_access() from public,anon;
grant execute on function public.traxelo_plan_access() to authenticated;
-- Private privileged implementation is required because clients have SELECT-only table access.
-- Ownership, tier, payload, revision and quota are always checked here, under a per-user lock.
create function traxelo_private.write_item(p_id uuid,p_kind text,p_data jsonb,p_revision bigint,p_deleted boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid(); old public.traxelo_workspace_items%rowtype; access jsonb; tier text; lim integer; total integer; result public.traxelo_workspace_items%rowtype;
begin
 if who is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_id is null or p_kind is null or p_kind not in ('route','schedule','settings') or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>524288 or p_revision is null or p_revision<0 or p_deleted is null then raise exception 'Dados inválidos.' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(who::text,41));
 select * into old from public.traxelo_workspace_items where user_id=who and id=p_id;
 if (old.id is null and p_revision<>0) or (old.id is not null and (old.revision<>p_revision or old.kind<>p_kind)) then raise exception 'Este registro mudou em outro aparelho. Sincronize antes de salvar.' using errcode='40001';end if;
 access:=public.traxelo_plan_access();tier:=access->>'plan';lim:=(access->>'routeLimit')::integer;
 if not p_deleted then
  if p_kind='route' then
   if jsonb_typeof(p_data->'name') is distinct from 'string' or coalesce(length(btrim(p_data->>'name')),0) not between 1 and 100 or jsonb_typeof(p_data->'points') is distinct from 'array' then raise exception 'Nome ou paradas inválidos.' using errcode='22023';end if;
   if jsonb_array_length(p_data->'points') not between 1 and 1000 or jsonb_typeof(p_data->'start') is distinct from 'object' then raise exception 'Origem ou paradas inválidas.' using errcode='22023';end if;
   if exists(select 1 from jsonb_array_elements((p_data->'points')||jsonb_build_array(p_data->'start')) p where jsonb_typeof(p) is distinct from 'object' or jsonb_typeof(p->'lat') is distinct from 'number' or jsonb_typeof(p->'lon') is distinct from 'number') then raise exception 'Coordenadas inválidas.' using errcode='22023';end if;
   if exists(select 1 from jsonb_array_elements((p_data->'points')||jsonb_build_array(p_data->'start')) p where abs((p->>'lat')::numeric)>90 or abs((p->>'lon')::numeric)>180 or ((p->>'lat')::numeric=0 and (p->>'lon')::numeric=0)) then raise exception 'Coordenadas fora do mapa.' using errcode='22023';end if;
   if coalesce(p_data->>'favorite','false') not in ('true','false') then raise exception 'Favorito inválido.' using errcode='22023';end if;
   if tier='free' and coalesce(p_data->>'favorite','false')='true' and coalesce(old.data->>'favorite','false')<>'true' then raise exception 'Favoritos disponíveis a partir do Plus.' using errcode='42501';end if;
   if old.id is null or old.deleted then
    total:=(access->>'routeCount')::integer;
    if lim is not null and total>=lim then raise exception 'Limite de rotas salvas atingido. Exclua uma rota ou escolha outro plano.' using errcode='P0001';end if;
   end if;
  elsif p_kind='schedule' then
   if tier='free' then raise exception 'Agenda disponível a partir do Plus.' using errcode='42501';end if;
   if coalesce(length(btrim(p_data->>'title')),0) not between 1 and 100 or coalesce(p_data->>'repeat','') not in ('once','weekly','monthly') or coalesce(p_data->>'targetType','') not in ('client','route') or coalesce(length(p_data->>'targetId'),0) not between 1 and 200 or coalesce(p_data->>'startDate','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Agendamento inválido.' using errcode='22023';end if;
   perform (p_data->>'startDate')::date;
   select count(*) into total from public.traxelo_workspace_items where user_id=who and kind='schedule' and not deleted;
   if (old.id is null or old.deleted) and total>=10000 then raise exception 'Agenda acima de 10.000 compromissos. Remova os antigos.';end if;
  else
   if exists(select 1 from public.traxelo_workspace_items where user_id=who and kind='settings' and not deleted and id<>p_id) then raise exception 'Configuração já existente. Sincronize.' using errcode='40001';end if;
   if tier<>'pro' and coalesce(p_data->'monthlyTarget','null'::jsonb) is distinct from coalesce(old.data->'monthlyTarget','null'::jsonb) and coalesce(p_data->'monthlyTarget','null'::jsonb)<>'null'::jsonb then raise exception 'Metas disponíveis no Pro.' using errcode='42501';end if;
   if tier<>'pro' and coalesce(p_data#>'{visitSettings,monthlyTarget}','null'::jsonb) is distinct from coalesce(old.data#>'{visitSettings,monthlyTarget}','null'::jsonb) and coalesce(p_data#>'{visitSettings,monthlyTarget}','null'::jsonb)<>'null'::jsonb then raise exception 'Metas disponíveis no Pro.' using errcode='42501';end if;
   if tier<>'pro' and coalesce(p_data->'frequencies','{}'::jsonb) is distinct from coalesce(old.data->'frequencies','{}'::jsonb) then raise exception 'Frequência de retorno disponível no Pro.' using errcode='42501';end if;
  end if;
 end if;
 if old.id is null then
  insert into public.traxelo_workspace_items(user_id,id,kind,data,deleted) values(who,p_id,p_kind,p_data,p_deleted) returning * into result;
 else
  update public.traxelo_workspace_items set data=p_data,deleted=p_deleted,revision=revision+1,updated_at=now() where user_id=who and id=p_id returning * into result;
 end if;
 return to_jsonb(result);
end;$$;
revoke all on function traxelo_private.write_item(uuid,text,jsonb,bigint,boolean) from public,anon;
grant execute on function traxelo_private.write_item(uuid,text,jsonb,bigint,boolean) to authenticated;
create function public.traxelo_write_item(p_id uuid,p_kind text,p_data jsonb,p_revision bigint,p_deleted boolean default false) returns jsonb language sql security invoker set search_path='' as $$ select traxelo_private.write_item(p_id,p_kind,p_data,p_revision,p_deleted);$$;
revoke all on function public.traxelo_write_item(uuid,text,jsonb,bigint,boolean) from public,anon;
grant execute on function public.traxelo_write_item(uuid,text,jsonb,bigint,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
