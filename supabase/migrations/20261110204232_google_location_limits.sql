-- Additive Google validation quotas. No memberships or existing client coordinates are changed.
BEGIN;
CREATE TABLE rotamapa_private.google_usage (
 bucket text NOT NULL,period date NOT NULL,used integer NOT NULL DEFAULT 0 CHECK(used>=0),
 PRIMARY KEY(bucket,period)
);
ALTER TABLE rotamapa_private.google_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rotamapa_private.google_usage FROM public,anon,authenticated;
CREATE FUNCTION rotamapa_private.google_reserve() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();portfolio uuid;access jsonb;day date:=timezone('America/Fortaleza',now())::date;month date:=date_trunc('month',day)::date;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 portfolio:=public.rotamapa_current_portfolio();
 IF NOT EXISTS(SELECT 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=portfolio) OR EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=portfolio) THEN RAISE EXCEPTION 'Carteira indisponível.' USING ERRCODE='42501';END IF;
 access:=traxelo_private.portfolio_plan_access();
 IF NOT(coalesce((access->>'signature')::boolean,false) OR coalesce((access->>'insider')::boolean,false) OR coalesce((access->>'qaOperator')::boolean,false)) THEN RAISE EXCEPTION 'Validação restrita aos participantes autorizados.' USING ERRCODE='42501';END IF;
 -- Serialize the three counters together; no per-instance or client-side quota.
 PERFORM pg_advisory_xact_lock(739029443188::bigint);
 INSERT INTO rotamapa_private.google_usage(bucket,period) VALUES('project-day',day),('project-month',month),('user:'||who,day) ON CONFLICT DO NOTHING;
 IF EXISTS(SELECT 1 FROM rotamapa_private.google_usage WHERE (bucket='project-day' AND period=day AND used>=2000) OR (bucket='project-month' AND period=month AND used>=3000) OR (bucket='user:'||who AND period=day AND used>=400)) THEN RETURN false;END IF;
 UPDATE rotamapa_private.google_usage SET used=used+1 WHERE (bucket='project-day' AND period=day) OR (bucket='project-month' AND period=month) OR (bucket='user:'||who AND period=day);
 RETURN true;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.google_reserve() FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.google_reserve() TO authenticated;
CREATE FUNCTION public.rotamapa_google_reserve() RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT rotamapa_private.google_reserve() $$;
REVOKE ALL ON FUNCTION public.rotamapa_google_reserve() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_google_reserve() TO authenticated;

-- Coordinates expire after 27 days; daily maintenance leaves a margin below Google's 30-day limit.
-- Only explicitly marked automatic Google data is touched; business/history fields are preserved.
CREATE FUNCTION rotamapa_private.google_clean(value jsonb,cutoff timestamptz DEFAULT now()) RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE result jsonb;entry record;expired boolean:=false;expiry timestamptz;
BEGIN
 IF jsonb_typeof(value)='array' THEN SELECT coalesce(jsonb_agg(rotamapa_private.google_clean(v,cutoff) ORDER BY n),'[]'::jsonb) INTO result FROM jsonb_array_elements(value) WITH ORDINALITY x(v,n);RETURN result;
 ELSIF jsonb_typeof(value)<>'object' THEN RETURN value;END IF;
 result:='{}';FOR entry IN SELECT key,v FROM jsonb_each(value) x(key,v) LOOP result:=result||jsonb_build_object(entry.key,rotamapa_private.google_clean(entry.v,cutoff));END LOOP;
 IF value->>'googleDerived'='true' OR coalesce(value->>'locationVerification','')<>'manual_reviewed' AND coalesce(value->>'locationSource','')<>'manual_confirmation' AND (coalesce(value->>'locationSource',value->>'provider','') LIKE 'google%' OR value ? 'googleExpiresAt') THEN
  BEGIN expiry:=(value->>'googleExpiresAt')::timestamptz;EXCEPTION WHEN others THEN expiry:=NULL;END;
  expired:=expiry IS NULL OR expiry<=cutoff;
  IF expired THEN
   FOREACH entry.key IN ARRAY ARRAY['lat','lon','lng','latitude','longitude'] LOOP IF result ? entry.key THEN result:=jsonb_set(result,ARRAY[entry.key],'null');END IF;END LOOP;
   IF result ? 'locationVerification' THEN result:=jsonb_set(result,'{locationVerification}','"pending"');END IF;
  END IF;
 END IF;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.google_clean(jsonb,timestamptz) FROM public,anon,authenticated;
CREATE OR REPLACE FUNCTION rotamapa_private.ensure_portfolio() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND auth.uid() IS NULL AND coalesce(current_setting('role',true),'none') IN ('none','service_role') AND current_setting('rotamapa.google_cleanup',true)='on' THEN RETURN new;END IF;
 IF TG_OP='UPDATE' AND (new.user_id<>old.user_id OR new.portfolio_id<>old.portfolio_id) THEN RAISE EXCEPTION 'Não é permitido mover um registro entre carteiras.' USING ERRCODE='42501';END IF;
 IF new.portfolio_id='00000000-0000-4000-8000-000000000000' THEN INSERT INTO public.rotamapa_portfolios(user_id,id,name) VALUES(new.user_id,new.portfolio_id,'Carteira inicial') ON CONFLICT DO NOTHING;END IF;
 PERFORM 1 FROM public.rotamapa_portfolios WHERE user_id=new.user_id AND id=new.portfolio_id FOR SHARE;
 IF EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id) THEN RAISE EXCEPTION 'Carteira arquivada ou excluída. Sincronize a lista de carteiras; os dados deste aparelho não serão reenviados.' USING ERRCODE='42501';END IF;
 RETURN new;
END;$$;

CREATE FUNCTION rotamapa_private.google_cache_cleanup() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE changed integer:=0;n integer;
BEGIN
 -- Admin/cron only. No network, customer deletion, financial updates or auth changes.
 PERFORM set_config('rotamapa.google_cleanup','on',true);
 UPDATE public.clients SET data=rotamapa_private.google_clean(data),
 latitude=CASE WHEN (data->>'googleDerived'='true' OR data->>'locationSource' LIKE 'google%' AND data->>'locationVerification'<>'manual_reviewed') AND (rotamapa_private.google_clean(data)->'lat')='null'::jsonb THEN NULL ELSE latitude END,
 longitude=CASE WHEN (data->>'googleDerived'='true' OR data->>'locationSource' LIKE 'google%' AND data->>'locationVerification'<>'manual_reviewed') AND (rotamapa_private.google_clean(data)->'lon')='null'::jsonb THEN NULL ELSE longitude END
 WHERE data::text LIKE '%googleExpiresAt%' AND data IS DISTINCT FROM rotamapa_private.google_clean(data);
 GET DIAGNOSTICS n=ROW_COUNT;changed:=changed+n;
 UPDATE public.traxelo_workspace_items SET data=rotamapa_private.google_clean(data),revision=revision+1,updated_at=now() WHERE data::text LIKE '%googleExpiresAt%' AND data IS DISTINCT FROM rotamapa_private.google_clean(data);GET DIAGNOSTICS n=ROW_COUNT;changed:=changed+n;
 UPDATE public.rotamapa_portfolio_versions SET clients=rotamapa_private.google_clean(clients) WHERE clients::text LIKE '%googleExpiresAt%' AND clients IS DISTINCT FROM rotamapa_private.google_clean(clients);GET DIAGNOSTICS n=ROW_COUNT;changed:=changed+n;
 PERFORM set_config('rotamapa.google_cleanup','off',true);
 RETURN changed;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.google_cache_cleanup() FROM public,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
