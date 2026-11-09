-- DRAFT: apply only after review and explicit authorization. No memberships are seeded.
-- Five permanent invitation slots; no emails or user identifiers bundled.
-- Signature rules and existing grants remain unchanged.
BEGIN;
CREATE TABLE rotamapa_private.insider_memberships (
 slot smallint PRIMARY KEY CHECK(slot BETWEEN 1 AND 5),
 user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
 approved_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE rotamapa_private.insider_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rotamapa_private.insider_memberships FROM public,anon,authenticated;
-- No client policy or activation RPC: grant only after the owner supplies and approves the emails.
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
 SELECT count(*) INTO count_portfolios FROM public.rotamapa_portfolios WHERE user_id=who;
 SELECT EXISTS(SELECT 1 FROM rotamapa_private.qa_operators WHERE user_id=who) INTO operator;
 RETURN jsonb_build_object('plan',tier,'signature',founder,'insider',pioneer,'paymentsEnabled',false,
  'beta',coalesce(beta,false) AND qa.user_id IS NULL AND NOT founder AND NOT pioneer,
  'routeLimit',CASE tier WHEN 'free' THEN 3 WHEN 'plus' THEN 20 ELSE NULL END,'routeCount',count_routes,
  'portfolioLimit',CASE tier WHEN 'free' THEN 1 WHEN 'plus' THEN 3 ELSE NULL END,'portfolioCount',count_portfolios,
  'qa',qa.user_id IS NOT NULL,'qaExpiresAt',qa.expires_at,'qaOperator',operator,'serverNow',now());
END;$$;
REVOKE ALL ON FUNCTION traxelo_private.portfolio_plan_access() FROM public,anon;
GRANT EXECUTE ON FUNCTION traxelo_private.portfolio_plan_access() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
