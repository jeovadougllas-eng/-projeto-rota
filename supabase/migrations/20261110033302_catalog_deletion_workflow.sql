-- DRAFT. Files are deleted only through the authenticated Storage API after strong confirmation.
-- No direct deletion of storage.objects in application SQL. Interrupted work remains frozen and resumable.
BEGIN;
CREATE TABLE rotamapa_private.portfolio_delete_tickets(
 user_id uuid NOT NULL,portfolio_id uuid NOT NULL,id uuid NOT NULL DEFAULT gen_random_uuid(),
 confirmation text NOT NULL,initial_revision bigint NOT NULL,started_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz,
 PRIMARY KEY(user_id,portfolio_id),UNIQUE(id),FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id)
);
ALTER TABLE rotamapa_private.portfolio_delete_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rotamapa_private.portfolio_delete_tickets FROM public,anon,authenticated;
CREATE FUNCTION rotamapa_private.delete_file_batch(who uuid,portfolio uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(name),'[]'::jsonb) FROM (SELECT name FROM storage.objects WHERE bucket_id='rotamapa-catalogs' AND name LIKE who::text||'/'||portfolio::text||'/%' ORDER BY name LIMIT 100) files;
$$;
REVOKE ALL ON FUNCTION rotamapa_private.delete_file_batch(uuid,uuid) FROM public,anon,authenticated;

CREATE FUNCTION public.rotamapa_prepare_portfolio_delete(p_portfolio uuid,p_revision bigint,p_confirmation text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();item public.rotamapa_portfolios%rowtype;ticket rotamapa_private.portfolio_delete_tickets%rowtype;status text;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text,41));
 SELECT * INTO item FROM public.rotamapa_portfolios WHERE user_id=who AND id=p_portfolio FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Carteira não encontrada nesta conta.' USING ERRCODE='42501';END IF;
 SELECT * INTO ticket FROM rotamapa_private.portfolio_delete_tickets WHERE user_id=who AND portfolio_id=p_portfolio;
 IF ticket.id IS NOT NULL THEN
  IF p_confirmation IS DISTINCT FROM ticket.confirmation THEN RAISE EXCEPTION 'Digite a confirmação exatamente como exibida.' USING ERRCODE='22023';END IF;
  RETURN jsonb_build_object('id',p_portfolio,'ticketId',ticket.id,'state',CASE WHEN ticket.completed_at IS NULL THEN 'deleting' ELSE 'deleted' END,'revision',item.revision,'paths',CASE WHEN ticket.completed_at IS NULL THEN rotamapa_private.delete_file_batch(who,p_portfolio) ELSE '[]'::jsonb END);
 END IF;
 IF p_revision IS DISTINCT FROM item.revision THEN RAISE EXCEPTION 'A carteira mudou. Sincronize antes de continuar.' USING ERRCODE='40001';END IF;
 IF p_confirmation IS DISTINCT FROM 'EXCLUIR '||item.name THEN RAISE EXCEPTION 'Digite a confirmação exatamente como exibida.' USING ERRCODE='22023';END IF;
 SELECT state INTO status FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=p_portfolio;
 IF status='deleted' THEN RAISE EXCEPTION 'Carteira já excluída.';END IF;
 IF status IS NULL THEN PERFORM public.rotamapa_manage_portfolio(p_portfolio,item.revision,'archive','ARQUIVAR '||item.name);END IF;
 INSERT INTO rotamapa_private.portfolio_delete_tickets(user_id,portfolio_id,confirmation,initial_revision) VALUES(who,p_portfolio,p_confirmation,item.revision) RETURNING * INTO ticket;
 SELECT * INTO item FROM public.rotamapa_portfolios WHERE user_id=who AND id=p_portfolio;
 RETURN jsonb_build_object('id',p_portfolio,'ticketId',ticket.id,'state','deleting','revision',item.revision,'paths',rotamapa_private.delete_file_batch(who,p_portfolio));
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_prepare_portfolio_delete(uuid,bigint,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_prepare_portfolio_delete(uuid,bigint,text) TO authenticated;

CREATE FUNCTION public.rotamapa_portfolio_delete_batch(p_ticket uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();ticket rotamapa_private.portfolio_delete_tickets%rowtype;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 SELECT * INTO ticket FROM rotamapa_private.portfolio_delete_tickets WHERE id=p_ticket AND user_id=who;
 IF ticket.id IS NULL OR ticket.completed_at IS NOT NULL THEN RAISE EXCEPTION 'Exclusão não disponível nesta conta.' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('id',ticket.portfolio_id,'ticketId',ticket.id,'state','deleting','paths',rotamapa_private.delete_file_batch(who,ticket.portfolio_id));
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_portfolio_delete_batch(uuid) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_portfolio_delete_batch(uuid) TO authenticated;

CREATE FUNCTION public.rotamapa_catalog_delete_allowed(p_path text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();parts text[]:=string_to_array(p_path,'/');
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' OR cardinality(parts)<>3 OR parts[1] IS DISTINCT FROM who::text OR parts[2] !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' OR parts[3] !~ '^[a-f0-9]{64}\.pdf$' THEN RETURN false;END IF;
 RETURN EXISTS(SELECT 1 FROM rotamapa_private.portfolio_delete_tickets t JOIN rotamapa_private.portfolio_lifecycle l ON l.user_id=t.user_id AND l.portfolio_id=t.portfolio_id WHERE t.user_id=who AND t.portfolio_id=parts[2]::uuid AND t.completed_at IS NULL AND l.state='archived');
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_catalog_delete_allowed(text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_catalog_delete_allowed(text) TO authenticated;
CREATE POLICY catalog_confirmed_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='rotamapa-catalogs' AND public.rotamapa_catalog_delete_allowed(name));
CREATE POLICY catalog_pending_delete_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='rotamapa-catalogs' AND public.rotamapa_catalog_delete_allowed(name));

CREATE FUNCTION public.rotamapa_finish_portfolio_delete(p_ticket uuid,p_confirmation text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();ticket rotamapa_private.portfolio_delete_tickets%rowtype;item public.rotamapa_portfolios%rowtype;result jsonb;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text,41));
 SELECT * INTO ticket FROM rotamapa_private.portfolio_delete_tickets WHERE id=p_ticket AND user_id=who FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Exclusão não disponível nesta conta.' USING ERRCODE='42501';END IF;
 IF p_confirmation IS DISTINCT FROM ticket.confirmation THEN RAISE EXCEPTION 'Digite a confirmação exatamente como exibida.' USING ERRCODE='22023';END IF;
 SELECT * INTO item FROM public.rotamapa_portfolios WHERE user_id=who AND id=ticket.portfolio_id FOR UPDATE;
 IF ticket.completed_at IS NOT NULL THEN RETURN jsonb_build_object('id',ticket.portfolio_id,'state','deleted','revision',item.revision);END IF;
 IF jsonb_array_length(rotamapa_private.delete_file_batch(who,ticket.portfolio_id))>0 THEN RAISE EXCEPTION 'Ainda há arquivos. Retome a exclusão para concluir.';END IF;
 DELETE FROM public.rotamapa_library_items WHERE user_id=who AND portfolio_id=ticket.portfolio_id;
 result:=public.rotamapa_manage_portfolio(ticket.portfolio_id,item.revision,'delete',p_confirmation);
 UPDATE rotamapa_private.portfolio_delete_tickets SET completed_at=now() WHERE user_id=who AND portfolio_id=ticket.portfolio_id;
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_finish_portfolio_delete(uuid,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_finish_portfolio_delete(uuid,text) TO authenticated;

CREATE FUNCTION rotamapa_private.pending_deletion_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM rotamapa_private.portfolio_delete_tickets WHERE user_id=old.user_id AND portfolio_id=old.portfolio_id AND completed_at IS NULL) THEN RAISE EXCEPTION 'A exclusão sem backup já começou. Retome a operação para concluir.';END IF;
 RETURN old;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.pending_deletion_guard() FROM public,anon,authenticated;
CREATE TRIGGER pending_deletion_blocks_restore BEFORE DELETE ON rotamapa_private.portfolio_lifecycle FOR EACH ROW EXECUTE FUNCTION rotamapa_private.pending_deletion_guard();
CREATE OR REPLACE FUNCTION public.rotamapa_portfolio_states() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();result jsonb;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',l.portfolio_id,'state',CASE WHEN t.id IS NOT NULL AND t.completed_at IS NULL THEN 'deleting' ELSE l.state END,'changedAt',l.changed_at)),'[]'::jsonb) INTO result FROM rotamapa_private.portfolio_lifecycle l LEFT JOIN rotamapa_private.portfolio_delete_tickets t ON t.user_id=l.user_id AND t.portfolio_id=l.portfolio_id WHERE l.user_id=who;
 RETURN result;
END;$$;
CREATE FUNCTION rotamapa_private.pending_deletion_name_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF new.name IS DISTINCT FROM old.name AND EXISTS(SELECT 1 FROM rotamapa_private.portfolio_delete_tickets WHERE user_id=old.user_id AND portfolio_id=old.id AND completed_at IS NULL) AND NOT EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=old.user_id AND portfolio_id=old.id AND state='deleted') THEN RAISE EXCEPTION 'Conclua a exclusão antes de alterar esta carteira.';END IF;
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.pending_deletion_name_guard() FROM public,anon,authenticated;
CREATE TRIGGER pending_deletion_blocks_rename BEFORE UPDATE ON public.rotamapa_portfolios FOR EACH ROW EXECUTE FUNCTION rotamapa_private.pending_deletion_name_guard();
NOTIFY pgrst,'reload schema';
COMMIT;
