-- Named, owned portfolios. Existing JSON, revisions, pins and event IDs stay unchanged.
BEGIN;
CREATE TABLE public.rotamapa_portfolios (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 id uuid NOT NULL, name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 80),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,id)
);
ALTER TABLE public.rotamapa_portfolios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rotamapa_portfolios FROM anon,authenticated;
GRANT SELECT,INSERT ON public.rotamapa_portfolios TO authenticated;
GRANT UPDATE(name,revision,updated_at) ON public.rotamapa_portfolios TO authenticated;
GRANT ALL ON public.rotamapa_portfolios TO service_role;
CREATE POLICY own_portfolios ON public.rotamapa_portfolios FOR ALL TO authenticated
 USING((select auth.uid())=user_id AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true')
 WITH CHECK((select auth.uid())=user_id AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
CREATE FUNCTION public.rotamapa_current_portfolio() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(nullif(coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb->>'x-rotamapa-portfolio','')::uuid,'00000000-0000-4000-8000-000000000000'::uuid)
$$;
REVOKE ALL ON FUNCTION public.rotamapa_current_portfolio() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_current_portfolio() TO authenticated,service_role;
-- Absent header selects only the initial portfolio, including older installations.
INSERT INTO public.rotamapa_portfolios(user_id,id,name)
 SELECT user_id,'00000000-0000-4000-8000-000000000000','Carteira inicial' FROM (
 SELECT user_id FROM public.clients UNION SELECT user_id FROM public.traxelo_visit_events
 UNION SELECT user_id FROM public.traxelo_workspace_items UNION SELECT user_id FROM public.rotamapa_commerce_items
 ) owners;
CREATE FUNCTION rotamapa_private.ensure_portfolio() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND (new.user_id<>old.user_id OR new.portfolio_id<>old.portfolio_id) THEN
  RAISE EXCEPTION 'Não é permitido mover um registro entre carteiras.' USING ERRCODE='42501';
 END IF;
 IF new.portfolio_id='00000000-0000-4000-8000-000000000000' THEN
  INSERT INTO public.rotamapa_portfolios(user_id,id,name) VALUES(new.user_id,new.portfolio_id,'Carteira inicial') ON CONFLICT DO NOTHING;
 END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.ensure_portfolio() FROM public,anon,authenticated;
CREATE FUNCTION rotamapa_private.portfolio_revision() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF new.user_id<>old.user_id OR new.id<>old.id OR new.created_at<>old.created_at OR new.revision<>old.revision+1 THEN RAISE EXCEPTION 'Esta carteira mudou em outro aparelho. Sincronize antes de renomear.' USING ERRCODE='40001';END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.portfolio_revision() FROM public,anon,authenticated;
CREATE TRIGGER portfolio_revision BEFORE UPDATE ON public.rotamapa_portfolios FOR EACH ROW EXECUTE FUNCTION rotamapa_private.portfolio_revision();
ALTER TABLE public.clients ADD COLUMN portfolio_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000000';
ALTER TABLE public.clients ADD CONSTRAINT clients_portfolio_fk FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id);
CREATE INDEX clients_portfolio ON public.clients(user_id,portfolio_id,local_id);
CREATE POLICY selected_portfolio ON public.clients AS RESTRICTIVE FOR ALL TO authenticated USING(portfolio_id=(select public.rotamapa_current_portfolio())) WITH CHECK(portfolio_id=(select public.rotamapa_current_portfolio()));
CREATE TRIGGER aaa_portfolio_guard BEFORE INSERT OR UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION rotamapa_private.ensure_portfolio();
ALTER TABLE public.traxelo_visit_events ADD COLUMN portfolio_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000000';
ALTER TABLE public.traxelo_visit_events ADD CONSTRAINT traxelo_visit_events_portfolio_fk FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id);
CREATE INDEX traxelo_visit_events_portfolio ON public.traxelo_visit_events(user_id,portfolio_id,id);
CREATE POLICY selected_portfolio ON public.traxelo_visit_events AS RESTRICTIVE FOR ALL TO authenticated USING(portfolio_id=(select public.rotamapa_current_portfolio())) WITH CHECK(portfolio_id=(select public.rotamapa_current_portfolio()));
CREATE TRIGGER aaa_portfolio_guard BEFORE INSERT OR UPDATE ON public.traxelo_visit_events FOR EACH ROW EXECUTE FUNCTION rotamapa_private.ensure_portfolio();
ALTER TABLE public.traxelo_workspace_items ADD COLUMN portfolio_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000000';
ALTER TABLE public.traxelo_workspace_items ADD CONSTRAINT traxelo_workspace_items_portfolio_fk FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id);
CREATE INDEX traxelo_workspace_items_portfolio ON public.traxelo_workspace_items(user_id,portfolio_id,id);
CREATE POLICY selected_portfolio ON public.traxelo_workspace_items AS RESTRICTIVE FOR ALL TO authenticated USING(portfolio_id=(select public.rotamapa_current_portfolio())) WITH CHECK(portfolio_id=(select public.rotamapa_current_portfolio()));
CREATE TRIGGER aaa_portfolio_guard BEFORE INSERT OR UPDATE ON public.traxelo_workspace_items FOR EACH ROW EXECUTE FUNCTION rotamapa_private.ensure_portfolio();
ALTER TABLE public.rotamapa_commerce_items ADD COLUMN portfolio_id uuid NOT NULL DEFAULT '00000000-0000-4000-8000-000000000000';
ALTER TABLE public.rotamapa_commerce_items ADD CONSTRAINT rotamapa_commerce_items_portfolio_fk FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id);
CREATE INDEX rotamapa_commerce_items_portfolio ON public.rotamapa_commerce_items(user_id,portfolio_id,id);
CREATE POLICY selected_portfolio ON public.rotamapa_commerce_items AS RESTRICTIVE FOR ALL TO authenticated USING(portfolio_id=(select public.rotamapa_current_portfolio())) WITH CHECK(portfolio_id=(select public.rotamapa_current_portfolio()));
CREATE TRIGGER aaa_portfolio_guard BEFORE INSERT OR UPDATE ON public.rotamapa_commerce_items FOR EACH ROW EXECUTE FUNCTION rotamapa_private.ensure_portfolio();
create or replace function traxelo_private.write_item(p_id uuid,p_kind text,p_data jsonb,p_revision bigint,p_deleted boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid(); portfolio uuid:=public.rotamapa_current_portfolio(); old public.traxelo_workspace_items%rowtype; access jsonb; tier text; lim integer; total integer; result public.traxelo_workspace_items%rowtype;
begin
 if who is null or coalesce(auth.jwt()->>'is_anonymous','false')='true' then raise exception 'Entre na sua conta.' using errcode='42501';end if;
 if p_id is null or p_kind is null or p_kind not in ('route','schedule','settings') or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>524288 or p_revision is null or p_revision<0 or p_deleted is null then raise exception 'Dados inválidos.' using errcode='22023';end if;
 if not exists(select 1 from public.rotamapa_portfolios where user_id=who and id=portfolio) and portfolio<>'00000000-0000-4000-8000-000000000000' then raise exception 'Carteira não encontrada.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(who::text,41));
 if exists(select 1 from public.traxelo_workspace_items where user_id=who and id=p_id and portfolio_id<>portfolio) then raise exception 'Registro de outra carteira.' using errcode='42501';end if;
 select * into old from public.traxelo_workspace_items where user_id=who and portfolio_id=portfolio and id=p_id;
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
   select count(*) into total from public.traxelo_workspace_items where user_id=who and portfolio_id=portfolio and kind='schedule' and not deleted;
   if (old.id is null or old.deleted) and total>=10000 then raise exception 'Agenda acima de 10.000 compromissos. Remova os antigos.';end if;
  else
   if exists(select 1 from public.traxelo_workspace_items where user_id=who and portfolio_id=portfolio and kind='settings' and not deleted and id<>p_id) then raise exception 'Configuração já existente. Sincronize.' using errcode='40001';end if;
   if tier<>'pro' and coalesce(p_data->'monthlyTarget','null'::jsonb) is distinct from coalesce(old.data->'monthlyTarget','null'::jsonb) and coalesce(p_data->'monthlyTarget','null'::jsonb)<>'null'::jsonb then raise exception 'Metas disponíveis no Pro.' using errcode='42501';end if;
   if tier<>'pro' and coalesce(p_data#>'{visitSettings,monthlyTarget}','null'::jsonb) is distinct from coalesce(old.data#>'{visitSettings,monthlyTarget}','null'::jsonb) and coalesce(p_data#>'{visitSettings,monthlyTarget}','null'::jsonb)<>'null'::jsonb then raise exception 'Metas disponíveis no Pro.' using errcode='42501';end if;
   if tier<>'pro' and coalesce(p_data->'frequencies','{}'::jsonb) is distinct from coalesce(old.data->'frequencies','{}'::jsonb) then raise exception 'Frequência de retorno disponível no Pro.' using errcode='42501';end if;
  end if;
 end if;
 if old.id is null then
  insert into public.traxelo_workspace_items(user_id,portfolio_id,id,kind,data,deleted) values(who,portfolio,p_id,p_kind,p_data,p_deleted) returning * into result;
 else
  update public.traxelo_workspace_items set data=p_data,deleted=p_deleted,revision=revision+1,updated_at=now() where user_id=who and portfolio_id=portfolio and id=p_id returning * into result;
 end if;
 return to_jsonb(result);
end;$$;
create or replace function public.traxelo_plan_access() returns jsonb language plpgsql security definer set search_path='' as $$
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
NOTIFY pgrst,'reload schema';
COMMIT;
