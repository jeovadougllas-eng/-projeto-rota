-- Keep privileged quota aggregation outside the exposed API schema.
BEGIN;
create or replace function traxelo_private.portfolio_plan_access() returns jsonb language plpgsql security definer set search_path='' as $$
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
REVOKE ALL ON FUNCTION traxelo_private.portfolio_plan_access() FROM public,anon;
GRANT EXECUTE ON FUNCTION traxelo_private.portfolio_plan_access() TO authenticated;
CREATE OR REPLACE FUNCTION public.traxelo_plan_access() RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT traxelo_private.portfolio_plan_access()
$$;
REVOKE ALL ON FUNCTION public.traxelo_plan_access() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.traxelo_plan_access() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
