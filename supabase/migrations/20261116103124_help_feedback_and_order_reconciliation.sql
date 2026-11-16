BEGIN;
-- Authorization comes from the existing administrator-provisioned operator table, never user metadata.
CREATE FUNCTION rotamapa_private.feedback_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND coalesce(auth.jwt()->>'is_anonymous','false')<>'true' AND EXISTS(SELECT 1 FROM rotamapa_private.qa_operators WHERE user_id=auth.uid());
$$;
REVOKE ALL ON FUNCTION rotamapa_private.feedback_admin() FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.feedback_admin() TO authenticated;
CREATE FUNCTION public.rotamapa_feedback_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$SELECT rotamapa_private.feedback_admin();$$;
REVOKE ALL ON FUNCTION public.rotamapa_feedback_admin() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_feedback_admin() TO authenticated;
CREATE TABLE public.rotamapa_feedback(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 id uuid NOT NULL,
 type text NOT NULL CHECK(type IN('problem','suggestion','praise')),
 description text NOT NULL CHECK(length(btrim(description)) BETWEEN 1 AND 6000),
 screenshot text CHECK(screenshot IS NULL OR length(screenshot)<=280000 AND screenshot ~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$'),
 has_screenshot boolean GENERATED ALWAYS AS (screenshot IS NOT NULL) STORED,
 screen text NOT NULL CHECK(length(screen)<=80),
 app_version text NOT NULL CHECK(length(app_version)<=30),
 status text NOT NULL DEFAULT 'received' CHECK(status IN('received','analysis','planned','resolved')),
 admin_response text NOT NULL DEFAULT '' CHECK(length(admin_response)<=2000),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,id)
);
CREATE INDEX rotamapa_feedback_created ON public.rotamapa_feedback(created_at DESC);
ALTER TABLE public.rotamapa_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_read ON public.rotamapa_feedback FOR SELECT TO authenticated USING(coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true' AND (user_id=(select auth.uid()) OR (select rotamapa_private.feedback_admin())));
CREATE POLICY feedback_send ON public.rotamapa_feedback FOR INSERT TO authenticated WITH CHECK(user_id=(select auth.uid()) AND coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
CREATE POLICY feedback_manage ON public.rotamapa_feedback FOR UPDATE TO authenticated USING((select rotamapa_private.feedback_admin())) WITH CHECK((select rotamapa_private.feedback_admin()));
REVOKE ALL ON public.rotamapa_feedback FROM public,anon,authenticated;
GRANT SELECT ON public.rotamapa_feedback TO authenticated;
GRANT INSERT(user_id,id,type,description,screenshot,screen,app_version) ON public.rotamapa_feedback TO authenticated;
GRANT UPDATE(status,admin_response) ON public.rotamapa_feedback TO authenticated;
CREATE FUNCTION rotamapa_private.feedback_revision() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$BEGIN NEW.revision:=OLD.revision+1;NEW.updated_at:=now();RETURN NEW;END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.feedback_revision() FROM public,anon,authenticated;
CREATE TRIGGER feedback_revision BEFORE UPDATE ON public.rotamapa_feedback FOR EACH ROW EXECUTE FUNCTION rotamapa_private.feedback_revision();

-- Reconciliation archives full originals in an owner-readable, append-only audit ledger.
CREATE TABLE public.rotamapa_order_reconciliations(
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 portfolio_id uuid NOT NULL,
 duplicate_id uuid NOT NULL,
 original_id uuid NOT NULL,
 original_snapshot jsonb NOT NULL,
 duplicate_snapshot jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,portfolio_id,duplicate_id),
 FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id) ON DELETE CASCADE
);
ALTER TABLE public.rotamapa_order_reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY reconciliation_read ON public.rotamapa_order_reconciliations FOR SELECT TO authenticated USING(user_id=(select auth.uid()) AND portfolio_id=(select public.rotamapa_current_portfolio()) AND coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
REVOKE ALL ON public.rotamapa_order_reconciliations FROM public,anon,authenticated;
GRANT SELECT ON public.rotamapa_order_reconciliations TO authenticated;
-- Private definer is necessary to write the immutable backup, while the public wrapper remains invoker.
CREATE FUNCTION rotamapa_private.reconcile_bussola(p_original uuid,p_duplicate uuid,p_original_revision bigint,p_duplicate_revision bigint) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();wallet uuid:=public.rotamapa_current_portfolio();a public.rotamapa_commerce_items;b public.rotamapa_commerce_items;updated jsonb;o jsonb;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' OR p_original=p_duplicate THEN RAISE EXCEPTION 'Conta inválida' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=wallet FOR SHARE;
 IF NOT EXISTS(SELECT 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=wallet) OR EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=wallet) THEN RAISE EXCEPTION 'Carteira inválida' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text||':'||wallet::text||':external_orders',0));
 -- Lock both rows in a deterministic order; stale or cross-account input never writes.
 PERFORM 1 FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=wallet AND id IN(p_original,p_duplicate) ORDER BY id FOR UPDATE;
 SELECT * INTO a FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=wallet AND id=p_original;
 SELECT * INTO b FROM public.rotamapa_commerce_items WHERE user_id=who AND portfolio_id=wallet AND id=p_duplicate;
 IF a.id IS NULL OR b.id IS NULL OR a.revision<>p_original_revision OR b.revision<>p_duplicate_revision THEN RAISE EXCEPTION 'Pedido alterado. Sincronize e reabra a conferência.' USING ERRCODE='40001';END IF;
 o:=b.data->'bussola';
 IF a.kind<>'sale' OR b.kind<>'sale' OR a.data->>'status'<>'confirmed' OR b.data->>'status'<>'confirmed' OR b.data#>>'{source,type}' IS DISTINCT FROM 'bussola_csv' OR o IS NULL THEN RAISE EXCEPTION 'Escolha um original e uma cópia Bússola ativos';END IF;
 IF a.data ? 'source' THEN
  IF jsonb_array_length(coalesce(a.data#>'{source,receipts}','[]'::jsonb))<>1 OR a.data#>>'{source,receipts,0,cnpj}' IS DISTINCT FROM o->>'cnpj' THEN RAISE EXCEPTION 'Número/CNPJ do PDF não corresponde';END IF;
 ELSIF a.data->>'clientId' IS DISTINCT FROM b.data->>'clientId' THEN RAISE EXCEPTION 'Escolha pedidos do mesmo cliente';END IF;
 IF a.data ? 'bussola' AND (a.data#>>'{bussola,cnpj}' IS DISTINCT FROM o->>'cnpj' OR a.data#>>'{bussola,orderNumber}' IS DISTINCT FROM o->>'orderNumber') THEN RAISE EXCEPTION 'Original vinculado a outro pedido';END IF;
 INSERT INTO public.rotamapa_order_reconciliations(user_id,portfolio_id,duplicate_id,original_id,original_snapshot,duplicate_snapshot) VALUES(who,wallet,b.id,a.id,to_jsonb(a),to_jsonb(b));
 UPDATE public.rotamapa_commerce_items SET data=data||jsonb_build_object('status','cancelled','cancelReason','Duplicidade conciliada com pedido RM '||a.id::text,'updatedAt',now(),'version',coalesce((data->>'version')::int,1)+1),revision=revision+1,updated_at=now() WHERE user_id=who AND portfolio_id=wallet AND id=b.id;
 updated:=a.data;
 IF a.data#>>'{source,receipts,0,orderNumber}' IS NOT NULL AND a.data#>>'{source,receipts,0,orderNumber}' IS DISTINCT FROM o->>'orderNumber' THEN updated:=updated||jsonb_build_object('bussolaLink',jsonb_build_object('reviewed',true,'cnpj',o->>'cnpj','pdfOrderNumber',a.data#>>'{source,receipts,0,orderNumber}','bussolaOrderNumber',o->>'orderNumber'));END IF;
 IF b.data->>'automaticVisitVersion'='1' AND a.data->>'automaticVisitVersion' IS DISTINCT FROM '1' THEN updated:=updated||jsonb_build_object('automaticVisitVersion',1,'automaticVisitRegisteredAt',b.data->>'automaticVisitRegisteredAt');END IF;
 updated:=updated||jsonb_build_object('bussola',o,'bussolaHistory',coalesce(a.data->'bussolaHistory','[]'::jsonb)||CASE WHEN a.data ? 'bussola' THEN jsonb_build_array(a.data->'bussola') ELSE '[]'::jsonb END,'updatedAt',now(),'version',coalesce((a.data->>'version')::int,1)+1);
 UPDATE public.rotamapa_commerce_items SET data=updated,revision=revision+1,updated_at=now() WHERE user_id=who AND portfolio_id=wallet AND id=a.id;
 RETURN jsonb_build_object('original',a.id,'archived',b.id,'backup',true);
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.reconcile_bussola(uuid,uuid,bigint,bigint) FROM public,anon;
GRANT EXECUTE ON FUNCTION rotamapa_private.reconcile_bussola(uuid,uuid,bigint,bigint) TO authenticated;
CREATE FUNCTION public.rotamapa_reconcile_bussola(p_original uuid,p_duplicate uuid,p_original_revision bigint,p_duplicate_revision bigint) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT rotamapa_private.reconcile_bussola(p_original,p_duplicate,p_original_revision,p_duplicate_revision);$$;
REVOKE ALL ON FUNCTION public.rotamapa_reconcile_bussola(uuid,uuid,bigint,bigint) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_reconcile_bussola(uuid,uuid,bigint,bigint) TO authenticated;

-- A canceled copy remains auditable but no longer blocks attachment of its external order to the original.
DO $patch$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_bussola()'::regprocedure);anchor text:=' IF new.kind<>''sale'' OR new.data->>''status''<>''confirmed''';
BEGIN
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Unexpected Bussola validator';END IF;
 source:=replace(source,anchor,$branch$
 IF TG_OP='UPDATE' AND old.data ? 'bussola' AND new.data->>'status'='cancelled' THEN
  IF new.user_id<>old.user_id OR new.portfolio_id<>old.portfolio_id OR new.id<>old.id OR new.kind<>old.kind OR new.revision<>old.revision+1 OR (new.data-ARRAY['status','cancelReason','version','updatedAt']) IS DISTINCT FROM (old.data-ARRAY['status','cancelReason','version','updatedAt']) OR length(btrim(coalesce(new.data->>'cancelReason','')))=0 THEN RAISE EXCEPTION 'Preserve canceled order originals';END IF;
  RETURN new;
 END IF;
 IF new.kind<>'sale' OR new.data->>'status'<>'confirmed'$branch$);
 source:=replace(source,'ARRAY[''bussola'',''bussolaHistory'',''version'',''updatedAt'']','ARRAY[''bussola'',''bussolaHistory'',''version'',''updatedAt'',''bussolaLink'',''automaticVisitVersion'',''automaticVisitRegisteredAt'']');
 source:=replace(source,'OR old.data#>>''{source,receipts,0,orderNumber}'' IS DISTINCT FROM o->>''orderNumber''', $mapped$OR (old.data#>>'{source,receipts,0,orderNumber}' IS DISTINCT FROM o->>'orderNumber' AND (new.data->'bussolaLink' IS DISTINCT FROM jsonb_build_object('reviewed',true,'cnpj',o->>'cnpj','pdfOrderNumber',old.data#>>'{source,receipts,0,orderNumber}','bussolaOrderNumber',o->>'orderNumber')))$mapped$);
 source:=replace(source,'x.kind=''sale'' AND x.id<>new.id','x.kind=''sale'' AND x.data->>''status''=''confirmed'' AND x.id<>new.id');
 source:=replace(source,'x.id<>new.id AND x.data#>>','x.id<>new.id AND x.data->>''status''=''confirmed'' AND x.data#>>');
 EXECUTE source;
END;$patch$;
DROP INDEX public.rotamapa_bussola_external_order;
CREATE UNIQUE INDEX rotamapa_bussola_external_order ON public.rotamapa_commerce_items(user_id,portfolio_id,(data#>>'{bussola,cnpj}'),(data#>>'{bussola,orderNumber}')) WHERE kind='sale' AND data ? 'bussola' AND data->>'status'='confirmed';
NOTIFY pgrst,'reload schema';
COMMIT;
