-- Account-bound QA progression. No payment, billing provider or global beta changes.
BEGIN;
CREATE TABLE rotamapa_private.qa_operators(user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);
CREATE TABLE rotamapa_private.qa_invites(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token_hash text NOT NULL UNIQUE CHECK(length(token_hash)=64),
 target_email text NOT NULL CHECK(length(target_email) BETWEEN 3 AND 320), initial_plan text NOT NULL CHECK(initial_plan IN ('free','plus','pro')),
 created_by uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',
 claimed_by uuid REFERENCES auth.users(id), claimed_at timestamptz
);
CREATE TABLE rotamapa_private.qa_accounts(
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 plan text NOT NULL CHECK(plan IN ('free','plus','pro')), expires_at timestamptz NOT NULL,
 operator_id uuid NOT NULL REFERENCES auth.users(id), invite_id uuid NOT NULL REFERENCES rotamapa_private.qa_invites(id), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE rotamapa_private.qa_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 action text NOT NULL CHECK(action IN ('invite_claimed','simulated_upgrade','test_reset')),
 from_plan text, to_plan text NOT NULL CHECK(to_plan IN ('free','plus','pro')), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE rotamapa_private.qa_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotamapa_private.qa_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotamapa_private.qa_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotamapa_private.qa_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rotamapa_private.qa_operators,rotamapa_private.qa_invites,rotamapa_private.qa_accounts,rotamapa_private.qa_events FROM public,anon,authenticated;
CREATE INDEX qa_events_user_date ON rotamapa_private.qa_events(user_id,created_at);
-- Operators are provisioned administratively after deployment; no personal identity is embedded in source.
CREATE OR REPLACE FUNCTION traxelo_private.portfolio_plan_access() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); tier text; beta boolean; count_routes integer; count_portfolios integer; qa rotamapa_private.qa_accounts%rowtype; operator boolean;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501'; END IF;
 SELECT * INTO qa FROM rotamapa_private.qa_accounts WHERE user_id=who AND expires_at>now();
 SELECT plan INTO tier FROM public.traxelo_plan_grants WHERE user_id=who AND (expires_at IS NULL OR expires_at>now());
 SELECT beta_pro INTO beta FROM public.traxelo_release_access WHERE singleton;
 tier:=coalesce(qa.plan,tier,CASE WHEN beta THEN 'pro' ELSE 'free' END);
 SELECT count(*) INTO count_routes FROM public.traxelo_workspace_items WHERE user_id=who AND kind='route' AND NOT deleted;
 SELECT count(*) INTO count_portfolios FROM public.rotamapa_portfolios WHERE user_id=who;
 SELECT EXISTS(SELECT 1 FROM rotamapa_private.qa_operators WHERE user_id=who) INTO operator;
 RETURN jsonb_build_object('plan',tier,'beta',coalesce(beta,false) AND qa.user_id IS NULL,'routeLimit',CASE tier WHEN 'free' THEN 3 WHEN 'plus' THEN 20 ELSE NULL END,'routeCount',count_routes,'portfolioLimit',CASE tier WHEN 'free' THEN 1 WHEN 'plus' THEN 3 ELSE NULL END,'portfolioCount',count_portfolios,'qa',qa.user_id IS NOT NULL,'qaExpiresAt',qa.expires_at,'qaOperator',operator,'serverNow',now());
END;$$;
REVOKE ALL ON FUNCTION traxelo_private.portfolio_plan_access() FROM public,anon;
GRANT EXECUTE ON FUNCTION traxelo_private.portfolio_plan_access() TO authenticated;
CREATE FUNCTION rotamapa_private.create_test_invite(p_email text,p_plan text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); token text; result rotamapa_private.qa_invites%rowtype; target_email_value text:=lower(btrim(p_email));
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' OR NOT EXISTS(SELECT 1 FROM rotamapa_private.qa_operators WHERE user_id=who) THEN RAISE EXCEPTION 'Somente o responsável pelos testes pode criar convites.' USING ERRCODE='42501'; END IF;
 IF p_plan NOT IN ('free','plus','pro') OR p_plan IS NULL OR target_email_value IS NULL OR length(target_email_value)>320 OR target_email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Informe o e-mail e o plano inicial.'; END IF;
 IF EXISTS(SELECT 1 FROM auth.users u JOIN rotamapa_private.qa_operators o ON o.user_id=u.id WHERE lower(u.email)=target_email_value) THEN RAISE EXCEPTION 'Use uma conta de teste separada para preservar a conta do responsável.'; END IF;
 token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 INSERT INTO rotamapa_private.qa_invites(token_hash,target_email,initial_plan,created_by) VALUES(encode(sha256(convert_to(token,'UTF8')),'hex'),target_email_value,p_plan,who) RETURNING * INTO result;
 RETURN jsonb_build_object('id',result.id,'token',token,'email',target_email_value,'plan',p_plan,'expiresAt',result.expires_at);
END;$$;
CREATE FUNCTION rotamapa_private.redeem_test_invite(p_token text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); invitation rotamapa_private.qa_invites%rowtype; actor_email text; confirmed timestamptz;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre com o e-mail autorizado para este teste.' USING ERRCODE='42501'; END IF;
 IF coalesce(p_token,'') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Convite inválido.'; END IF;
 SELECT * INTO invitation FROM rotamapa_private.qa_invites WHERE token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') FOR UPDATE;
 SELECT lower(u.email),u.email_confirmed_at INTO actor_email,confirmed FROM auth.users u WHERE u.id=who;
 IF invitation.id IS NULL OR invitation.target_email IS DISTINCT FROM actor_email OR confirmed IS NULL OR EXISTS(SELECT 1 FROM rotamapa_private.qa_operators WHERE user_id=who) THEN RAISE EXCEPTION 'Este convite exige o e-mail autorizado e confirmado. Sua conta atual não foi alterada.' USING ERRCODE='42501'; END IF;
 IF invitation.claimed_by IS NOT NULL THEN
  IF invitation.claimed_by<>who THEN RAISE EXCEPTION 'Convite já utilizado.' USING ERRCODE='42501'; END IF;
  RETURN traxelo_private.portfolio_plan_access();
 END IF;
 IF invitation.expires_at<=now() THEN RAISE EXCEPTION 'Este convite expirou. Peça um novo link ao responsável.'; END IF;
 IF EXISTS(SELECT 1 FROM public.traxelo_plan_grants WHERE user_id=who AND (expires_at IS NULL OR expires_at>now())) THEN RAISE EXCEPTION 'Esta conta já tem uma concessão de plano. Use uma conta dedicada ao teste.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text,41));
 IF EXISTS(SELECT 1 FROM rotamapa_private.qa_accounts WHERE user_id=who AND expires_at>now()) THEN RAISE EXCEPTION 'O teste já está ativo. Use as opções de upgrade ou reiniciar teste.'; END IF;
 UPDATE rotamapa_private.qa_invites SET claimed_by=who,claimed_at=now() WHERE id=invitation.id;
 INSERT INTO rotamapa_private.qa_accounts(user_id,plan,expires_at,operator_id,invite_id) VALUES(who,invitation.initial_plan,now()+interval '30 days',invitation.created_by,invitation.id)
 ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan,expires_at=excluded.expires_at,operator_id=excluded.operator_id,invite_id=excluded.invite_id,updated_at=now();
 INSERT INTO rotamapa_private.qa_events(user_id,action,to_plan) VALUES(who,'invite_claimed',invitation.initial_plan);
 RETURN traxelo_private.portfolio_plan_access();
END;$$;
CREATE FUNCTION rotamapa_private.simulate_upgrade(p_plan text,p_reset boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); account rotamapa_private.qa_accounts%rowtype;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na conta de teste.' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text,41));
 SELECT * INTO account FROM rotamapa_private.qa_accounts WHERE user_id=who AND expires_at>now() FOR UPDATE;
 IF account.user_id IS NULL THEN RAISE EXCEPTION 'Simulação disponível somente para contas de teste autorizadas.' USING ERRCODE='42501'; END IF;
 IF p_plan IS NULL OR p_reset IS NULL OR p_plan NOT IN ('free','plus','pro') OR (p_reset AND p_plan<>'free') THEN RAISE EXCEPTION 'Etapa de teste inválida.'; END IF;
 IF NOT p_reset AND p_plan=account.plan THEN RETURN traxelo_private.portfolio_plan_access(); END IF;
 IF NOT p_reset AND NOT((account.plan='free' AND p_plan='plus') OR (account.plan='plus' AND p_plan='pro')) THEN RAISE EXCEPTION 'Teste a progressão Free, depois Plus e por último Pro.'; END IF;
 UPDATE rotamapa_private.qa_accounts SET plan=p_plan,updated_at=now() WHERE user_id=who;
 INSERT INTO rotamapa_private.qa_events(user_id,action,from_plan,to_plan) VALUES(who,CASE WHEN p_reset THEN 'test_reset' ELSE 'simulated_upgrade' END,account.plan,p_plan);
 RETURN traxelo_private.portfolio_plan_access();
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.create_test_invite(text,text),rotamapa_private.redeem_test_invite(text),rotamapa_private.simulate_upgrade(text,boolean) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.create_test_invite(text,text),rotamapa_private.redeem_test_invite(text),rotamapa_private.simulate_upgrade(text,boolean) TO authenticated;
CREATE FUNCTION public.rotamapa_create_test_invite(p_email text,p_plan text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT rotamapa_private.create_test_invite(p_email,p_plan)$$;
CREATE FUNCTION public.rotamapa_redeem_test_invite(p_token text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT rotamapa_private.redeem_test_invite(p_token)$$;
CREATE FUNCTION public.rotamapa_simulate_upgrade(p_plan text,p_reset boolean DEFAULT false) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT rotamapa_private.simulate_upgrade(p_plan,p_reset)$$;
REVOKE ALL ON FUNCTION public.rotamapa_create_test_invite(text,text),public.rotamapa_redeem_test_invite(text),public.rotamapa_simulate_upgrade(text,boolean) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_create_test_invite(text,text),public.rotamapa_redeem_test_invite(text),public.rotamapa_simulate_upgrade(text,boolean) TO authenticated;
CREATE FUNCTION rotamapa_private.portfolio_plan_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid(); access jsonb; total integer; maximum integer;
BEGIN
 IF who IS NULL AND coalesce(current_setting('role',true),'none') IN ('none','service_role') THEN RETURN new; END IF;
 IF who IS DISTINCT FROM new.user_id OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Conta inválida.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=new.id) THEN RETURN new; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text,41));access:=traxelo_private.portfolio_plan_access();maximum:=(access->>'portfolioLimit')::integer;
 SELECT count(*) INTO total FROM public.rotamapa_portfolios WHERE user_id=who;
 IF maximum IS NOT NULL AND total>=maximum THEN RAISE EXCEPTION 'Limite de carteiras do plano atingido. Consulte as opções de upgrade.' USING ERRCODE='42501'; END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.portfolio_plan_limit() FROM public,anon,authenticated;
CREATE TRIGGER aaa_portfolio_plan_limit BEFORE INSERT ON public.rotamapa_portfolios FOR EACH ROW EXECUTE FUNCTION rotamapa_private.portfolio_plan_limit();
CREATE FUNCTION rotamapa_private.commerce_plan_limit() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF new.kind='sale' AND new.data ? 'source' AND (TG_OP='INSERT' OR coalesce(old.data->>'status','') IN ('no_sale','deferred')) AND (public.traxelo_plan_access()->>'plan')='free' THEN RAISE EXCEPTION 'Importação de pedidos PDF disponível a partir do Plus.' USING ERRCODE='42501'; END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.commerce_plan_limit() FROM public,anon,authenticated;
CREATE TRIGGER aab_commerce_plan_limit BEFORE INSERT OR UPDATE ON public.rotamapa_commerce_items FOR EACH ROW EXECUTE FUNCTION rotamapa_private.commerce_plan_limit();
NOTIFY pgrst,'reload schema';
COMMIT;
