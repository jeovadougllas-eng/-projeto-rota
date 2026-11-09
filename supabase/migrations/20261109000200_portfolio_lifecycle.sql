-- DRAFT. No operation is invoked here. Apply only after explicit deployment approval.
-- Archived portfolios retain all data. Permanent deletion keeps an immutable tombstone.
BEGIN;
CREATE TABLE rotamapa_private.portfolio_lifecycle (
 user_id uuid NOT NULL,portfolio_id uuid NOT NULL,state text NOT NULL CHECK(state IN ('archived','deleted')),
 changed_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,portfolio_id),
 FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id)
);
ALTER TABLE rotamapa_private.portfolio_lifecycle ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rotamapa_private.portfolio_lifecycle FROM public,anon,authenticated;
CREATE FUNCTION public.rotamapa_portfolio_states() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();result jsonb;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',portfolio_id,'state',state,'changedAt',changed_at)),'[]'::jsonb) INTO result FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_portfolio_states() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_portfolio_states() TO authenticated;
-- Serialize writers with archive/delete and reject stale device resurrection, including initial portfolio upserts.
CREATE OR REPLACE FUNCTION rotamapa_private.ensure_portfolio() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND (new.user_id<>old.user_id OR new.portfolio_id<>old.portfolio_id) THEN RAISE EXCEPTION 'Não é permitido mover um registro entre carteiras.' USING ERRCODE='42501';END IF;
 IF new.portfolio_id='00000000-0000-4000-8000-000000000000' THEN INSERT INTO public.rotamapa_portfolios(user_id,id,name) VALUES(new.user_id,new.portfolio_id,'Carteira inicial') ON CONFLICT DO NOTHING;END IF;
 PERFORM 1 FROM public.rotamapa_portfolios WHERE user_id=new.user_id AND id=new.portfolio_id FOR SHARE;
 IF EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id) THEN RAISE EXCEPTION 'Carteira arquivada ou excluída. Sincronize a lista de carteiras; os dados deste aparelho não serão reenviados.' USING ERRCODE='42501';END IF;
 RETURN new;
END;$$;
-- The versions RPC also writes this table; protect it from a stale concurrent replace/restore.
CREATE TRIGGER aaa_portfolio_guard BEFORE INSERT ON public.rotamapa_portfolio_versions FOR EACH ROW EXECUTE FUNCTION rotamapa_private.ensure_portfolio();
CREATE FUNCTION public.rotamapa_manage_portfolio(p_portfolio uuid,p_revision bigint,p_action text,p_confirmation text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();item public.rotamapa_portfolios%rowtype;status text;expected text;counts jsonb;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 IF p_action IS NULL OR p_action NOT IN ('archive','restore','delete') THEN RAISE EXCEPTION 'Operação inválida.' USING ERRCODE='22023';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text,41));
 SELECT * INTO item FROM public.rotamapa_portfolios WHERE user_id=who AND id=p_portfolio FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Carteira não encontrada nesta conta.' USING ERRCODE='42501';END IF;
 IF p_revision IS DISTINCT FROM item.revision THEN RAISE EXCEPTION 'A carteira mudou em outro aparelho. Sincronize antes de continuar.' USING ERRCODE='40001';END IF;
 SELECT state INTO status FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=p_portfolio;
 IF status='deleted' THEN RAISE EXCEPTION 'Esta carteira foi excluída definitivamente.' USING ERRCODE='42501';END IF;
 expected:=CASE p_action WHEN 'delete' THEN 'EXCLUIR ' WHEN 'archive' THEN 'ARQUIVAR ' ELSE 'RESTAURAR ' END||item.name;
 IF p_confirmation IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Digite a confirmação exatamente como exibida.' USING ERRCODE='22023';END IF;
 IF p_action='restore' THEN
  IF status IS DISTINCT FROM 'archived' THEN RAISE EXCEPTION 'Esta carteira não está arquivada.';END IF;
  DELETE FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=p_portfolio;
 ELSIF p_action='archive' THEN
  IF status IS NOT NULL THEN RAISE EXCEPTION 'A carteira já está arquivada.';END IF;
  INSERT INTO rotamapa_private.portfolio_lifecycle(user_id,portfolio_id,state) VALUES(who,p_portfolio,'archived');
 ELSE
  -- Exact owner AND portfolio predicates; no auth user, profile, grant or other portfolio touched.
  INSERT INTO rotamapa_private.portfolio_lifecycle(user_id,portfolio_id,state) VALUES(who,p_portfolio,'deleted') ON CONFLICT(user_id,portfolio_id) DO UPDATE SET state='deleted',changed_at=now();
  DELETE FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=p_portfolio;
  DELETE FROM public.traxelo_workspace_items WHERE user_id=who AND portfolio_id=p_portfolio;
  DELETE FROM public.traxelo_visit_events WHERE user_id=who AND portfolio_id=p_portfolio;
  DELETE FROM public.rotamapa_portfolio_versions WHERE user_id=who AND portfolio_id=p_portfolio;
  DELETE FROM public.clients WHERE user_id=who AND portfolio_id=p_portfolio;
 END IF;
 UPDATE public.rotamapa_portfolios SET name=CASE WHEN p_action='delete' THEN 'Carteira excluída' ELSE name END,revision=revision+1,updated_at=now() WHERE user_id=who AND id=p_portfolio;
 RETURN jsonb_build_object('id',p_portfolio,'state',CASE p_action WHEN 'restore' THEN 'active' WHEN 'archive' THEN 'archived' ELSE 'deleted' END,'revision',item.revision+1);
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_manage_portfolio(uuid,bigint,text,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_manage_portfolio(uuid,bigint,text,text) TO authenticated;
-- Archived data still occupies its existing quota. Deleted tombstones contain no data and do not.
CREATE OR REPLACE FUNCTION traxelo_private.portfolio_plan_access() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); tier text; beta boolean; count_routes integer; count_portfolios integer;
 qa rotamapa_private.qa_accounts%rowtype; operator boolean; founder boolean:=false; pioneer boolean:=false;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN
  RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';
 END IF;
 SELECT * INTO qa FROM rotamapa_private.qa_accounts WHERE user_id=who AND expires_at>now();
 SELECT plan INTO tier FROM public.traxelo_plan_grants WHERE user_id=who AND (expires_at IS NULL OR expires_at>now());
 SELECT beta_pro INTO beta FROM public.traxelo_release_access WHERE singleton;
 tier:=coalesce(qa.plan,tier,CASE WHEN beta THEN 'pro' ELSE 'free' END);
 SELECT EXISTS(SELECT 1 FROM auth.users u JOIN public.traxelo_plan_grants g ON g.user_id=u.id
  WHERE u.id=who AND u.raw_app_meta_data->>'rotamapa_membership'='signature_founder'
  AND g.plan='pro' AND g.expires_at IS NULL) AND qa.user_id IS NULL INTO founder;
 SELECT EXISTS(SELECT 1 FROM rotamapa_private.insider_memberships WHERE user_id=who) AND qa.user_id IS NULL AND NOT founder INTO pioneer;
 IF pioneer THEN tier:='pro'; END IF;
 SELECT count(*) INTO count_routes FROM public.traxelo_workspace_items WHERE user_id=who AND kind='route' AND NOT deleted;
 SELECT count(*) INTO count_portfolios FROM public.rotamapa_portfolios p WHERE p.user_id=who AND NOT EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle l WHERE l.user_id=p.user_id AND l.portfolio_id=p.id AND l.state='deleted');
 SELECT EXISTS(SELECT 1 FROM rotamapa_private.qa_operators WHERE user_id=who) INTO operator;
 RETURN jsonb_build_object('plan',tier,'signature',founder,'insider',pioneer,'paymentsEnabled',false,
  'beta',coalesce(beta,false) AND qa.user_id IS NULL AND NOT founder AND NOT pioneer,
  'routeLimit',CASE tier WHEN 'free' THEN 3 WHEN 'plus' THEN 20 ELSE NULL END,'routeCount',count_routes,
  'portfolioLimit',CASE tier WHEN 'free' THEN 1 WHEN 'plus' THEN 3 ELSE NULL END,'portfolioCount',count_portfolios,
  'qa',qa.user_id IS NOT NULL,'qaExpiresAt',qa.expires_at,'qaOperator',operator,'serverNow',now());
END;$$;
REVOKE ALL ON FUNCTION traxelo_private.portfolio_plan_access() FROM public,anon;
GRANT EXECUTE ON FUNCTION traxelo_private.portfolio_plan_access() TO authenticated;
CREATE OR REPLACE FUNCTION rotamapa_private.portfolio_plan_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); access jsonb; total integer; maximum integer;
BEGIN
 IF who IS NULL AND coalesce(current_setting('role',true),'none') IN ('none','service_role') THEN RETURN new; END IF;
 IF who IS DISTINCT FROM new.user_id OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Conta inválida.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=new.id) THEN RETURN new; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text,41));access:=traxelo_private.portfolio_plan_access();maximum:=(access->>'portfolioLimit')::integer;
 SELECT count(*) INTO total FROM public.rotamapa_portfolios p WHERE p.user_id=who AND NOT EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle l WHERE l.user_id=p.user_id AND l.portfolio_id=p.id AND l.state='deleted');
 IF maximum IS NOT NULL AND total>=maximum THEN RAISE EXCEPTION 'Limite de carteiras do plano atingido. Consulte as opções de upgrade.' USING ERRCODE='42501'; END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.portfolio_plan_limit() FROM public,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
