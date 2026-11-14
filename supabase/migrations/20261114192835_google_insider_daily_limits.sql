-- Preserve existing counters. Profiles come from the trusted membership function.
BEGIN;
CREATE FUNCTION rotamapa_private.google_reserve_decision() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();portfolio uuid;access jsonb;day date;month date;daily_limit integer;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 portfolio:=public.rotamapa_current_portfolio();
 IF NOT EXISTS(SELECT 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=portfolio) OR EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=portfolio) THEN RAISE EXCEPTION 'Carteira indisponível.' USING ERRCODE='42501';END IF;
 access:=traxelo_private.portfolio_plan_access();
 IF NOT(coalesce((access->>'signature')::boolean,false) OR coalesce((access->>'insider')::boolean,false) OR coalesce((access->>'qaOperator')::boolean,false)) THEN RAISE EXCEPTION 'Validação restrita aos participantes autorizados.' USING ERRCODE='42501';END IF;
 daily_limit:=CASE WHEN coalesce((access->>'signature')::boolean,false) THEN NULL WHEN coalesce((access->>'insider')::boolean,false) THEN 20 ELSE 400 END;
 -- The same lock serializes legacy boolean callers and the detailed API across all devices.
 PERFORM pg_advisory_xact_lock(739029443188::bigint);
 day:=timezone('America/Fortaleza',clock_timestamp())::date;month:=date_trunc('month',day)::date;
 INSERT INTO rotamapa_private.google_usage(bucket,period) VALUES('project-day',day),('project-month',month),('user:'||who,day) ON CONFLICT DO NOTHING;
 -- The monthly decision wins, so a monthly block never promises renewal tomorrow.
 IF EXISTS(SELECT 1 FROM rotamapa_private.google_usage WHERE bucket='project-month' AND period=month AND used>=4000) THEN
  RETURN jsonb_build_object('allowed',false,'code','google_project_monthly_limit','resetAt',((month+interval '1 month')::timestamp AT TIME ZONE 'America/Fortaleza'));
 END IF;
 IF daily_limit IS NOT NULL AND EXISTS(SELECT 1 FROM rotamapa_private.google_usage WHERE bucket='user:'||who AND period=day AND used>=daily_limit) THEN
  RETURN jsonb_build_object('allowed',false,'code','google_user_daily_limit','resetAt',((day+1)::timestamp AT TIME ZONE 'America/Fortaleza'));
 END IF;
 -- Signature has no individual/day cap; all profiles share the project/month ceiling.
 UPDATE rotamapa_private.google_usage SET used=used+1 WHERE (bucket='project-day' AND period=day) OR (bucket='project-month' AND period=month) OR (bucket='user:'||who AND period=day);
 RETURN jsonb_build_object('allowed',true);
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.google_reserve_decision() FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.google_reserve_decision() TO authenticated;
CREATE OR REPLACE FUNCTION rotamapa_private.google_reserve() RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT coalesce((rotamapa_private.google_reserve_decision()->>'allowed')::boolean,false)$$;
REVOKE ALL ON FUNCTION rotamapa_private.google_reserve() FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.google_reserve() TO authenticated;
CREATE FUNCTION public.rotamapa_google_reserve_status() RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT rotamapa_private.google_reserve_decision()$$;
REVOKE ALL ON FUNCTION public.rotamapa_google_reserve_status() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_google_reserve_status() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
