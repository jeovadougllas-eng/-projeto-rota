BEGIN;
-- Backup and replay barrier are owner/portfolio scoped. No existing commercial rows are changed by this migration.
CREATE TABLE public.rotamapa_sales_resets(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 portfolio_id uuid NOT NULL,
 month text NOT NULL CHECK(month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 generation uuid NOT NULL DEFAULT gen_random_uuid(),
 removed_ids uuid[] NOT NULL,
 backup jsonb NOT NULL,
 ledger_digest text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,portfolio_id,generation),
 FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id) ON DELETE CASCADE
);
ALTER TABLE public.rotamapa_sales_resets ENABLE ROW LEVEL SECURITY;
CREATE POLICY sales_reset_owner ON public.rotamapa_sales_resets FOR SELECT TO authenticated USING(user_id=(select auth.uid()) AND portfolio_id=(select public.rotamapa_current_portfolio()) AND coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
REVOKE ALL ON public.rotamapa_sales_resets FROM public,anon,authenticated;
GRANT SELECT ON public.rotamapa_sales_resets TO authenticated;
CREATE FUNCTION public.rotamapa_sales_reset_state() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;who uuid:=auth.uid();wallet uuid:=public.rotamapa_current_portfolio();
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 SELECT jsonb_build_object('generations',coalesce((SELECT jsonb_object_agg(month,generation) FROM (SELECT DISTINCT ON(month) month,generation FROM public.rotamapa_sales_resets WHERE user_id=who AND portfolio_id=wallet ORDER BY month,created_at DESC,generation DESC) x),'{}'::jsonb),'removedIds',coalesce((SELECT jsonb_agg(DISTINCT item) FROM public.rotamapa_sales_resets r CROSS JOIN LATERAL unnest(r.removed_ids) item WHERE user_id=who AND portfolio_id=wallet),'[]'::jsonb)) INTO result;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_sales_reset_state() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_sales_reset_state() TO authenticated;
CREATE FUNCTION rotamapa_private.sales_reset_guard() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE active_generation uuid;
BEGIN
 IF new.kind<>'sale' THEN RETURN new;END IF;
 IF EXISTS(SELECT 1 FROM public.rotamapa_sales_resets WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND new.id=ANY(removed_ids)) THEN RAISE EXCEPTION 'Pedido removido na atualização mensal. Atualize e sincronize o aplicativo.' USING ERRCODE='40001';END IF;
 SELECT generation INTO active_generation FROM public.rotamapa_sales_resets WHERE user_id=new.user_id AND portfolio_id=new.portfolio_id AND month=left(new.data->>'date',7) ORDER BY created_at DESC,generation DESC LIMIT 1;
 IF active_generation IS NOT NULL AND new.data->>'resetGeneration' IS DISTINCT FROM active_generation::text THEN RAISE EXCEPTION 'A base deste mês foi reiniciada. Atualize e sincronize antes de importar ou lançar novos pedidos.' USING ERRCODE='40001';END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.sales_reset_guard() FROM public,anon,authenticated;
CREATE TRIGGER aaa_sales_reset_guard BEFORE INSERT OR UPDATE ON public.rotamapa_commerce_items FOR EACH ROW EXECUTE FUNCTION rotamapa_private.sales_reset_guard();

-- Maintenance-only action for the explicitly authorized November 2026 rebuild.
-- It is not exposed as a browser RPC and cannot delete October or another month.
CREATE FUNCTION rotamapa_private.reset_november_2026_sales(p_owner uuid,p_portfolio uuid,p_expected_count bigint,p_expected_digest text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE rows_json jsonb;ids uuid[];row_count bigint;fingerprint text;reset_id uuid;affected bigint;workspace_json jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM rotamapa_private.qa_operators WHERE user_id=p_owner) THEN RAISE EXCEPTION 'Maintenance requires the provisioned owner';END IF;
 PERFORM 1 FROM public.rotamapa_portfolios WHERE user_id=p_owner AND id=p_portfolio FOR UPDATE;
 IF NOT FOUND OR EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=p_owner AND portfolio_id=p_portfolio) THEN RAISE EXCEPTION 'Carteira indisponível';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_owner::text||':'||p_portfolio::text||':external_orders',0));
 SELECT jsonb_agg(to_jsonb(c) ORDER BY c.id),array_agg(c.id ORDER BY c.id),count(*),md5(coalesce(string_agg(c.id::text||':'||c.revision::text||':'||c.data::text,E'\n' ORDER BY c.id),'')) INTO rows_json,ids,row_count,fingerprint FROM public.rotamapa_commerce_items c WHERE c.user_id=p_owner AND c.portfolio_id=p_portfolio AND c.kind='sale' AND c.data->>'date'>='2026-11-01' AND c.data->>'date'<'2026-12-01';
 IF row_count=0 OR row_count IS DISTINCT FROM p_expected_count OR fingerprint IS DISTINCT FROM p_expected_digest THEN RAISE EXCEPTION 'O histórico mudou. Refaça a conferência antes da atualização mensal.' USING ERRCODE='40001';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(w) ORDER BY w.id),'[]'::jsonb) INTO workspace_json FROM public.traxelo_workspace_items w WHERE w.user_id=p_owner AND w.portfolio_id=p_portfolio AND w.kind='settings';
 INSERT INTO public.rotamapa_sales_resets(user_id,portfolio_id,month,removed_ids,backup,ledger_digest) VALUES(p_owner,p_portfolio,'2026-11',ids,jsonb_build_object('sales',rows_json,'workspaceSettings',workspace_json),fingerprint) RETURNING generation INTO reset_id;
 DELETE FROM public.rotamapa_commerce_items WHERE user_id=p_owner AND portfolio_id=p_portfolio AND kind='sale' AND data->>'date'>='2026-11-01' AND data->>'date'<'2026-12-01' AND id=ANY(ids);
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>row_count THEN RAISE EXCEPTION 'A remoção não corresponde ao backup';END IF;
 RETURN jsonb_build_object('month','2026-11','removed',affected,'backup',true,'generation',reset_id);
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.reset_november_2026_sales(uuid,uuid,bigint,text) FROM public,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
