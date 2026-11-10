-- Storage metadata is a local synthetic fixture. DELETE here simulates the Storage API's RLS step;
-- application SQL never deletes hosted Storage metadata or bypasses its file API.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000033"}',false);
INSERT INTO storage.objects(bucket_id,name) VALUES('rotamapa-catalogs','00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000033/'||repeat('e',64)||'.pdf');
DO $$BEGIN BEGIN PERFORM public.rotamapa_prepare_portfolio_delete('00000000-0000-4000-8000-000000000033',1,'wrong');RAISE EXCEPTION 'WEAK_DELETE_CONFIRMATION';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;END$$;
CREATE TEMP TABLE delete_ticket_fixture AS SELECT public.rotamapa_prepare_portfolio_delete('00000000-0000-4000-8000-000000000033',1,'EXCLUIR Envio pendente') AS data;
SELECT test.ensure((SELECT jsonb_array_length(data->'paths')=2 FROM delete_ticket_fixture),'confirmation snapshots only the selected portfolio originals');
SELECT test.ensure((public.rotamapa_portfolio_states() @> '[{"id":"00000000-0000-4000-8000-000000000033","state":"deleting"}]'),'pending deletion is visible as resumable');
DO $$BEGIN
 BEGIN PERFORM public.rotamapa_finish_portfolio_delete((SELECT (data->>'ticketId')::uuid FROM delete_ticket_fixture),'EXCLUIR Envio pendente');RAISE EXCEPTION 'FILES_NOT_REMOVED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='FILES_NOT_REMOVED' THEN RAISE;END IF;END;
 BEGIN PERFORM public.rotamapa_manage_portfolio('00000000-0000-4000-8000-000000000033',2,'restore','RESTAURAR Envio pendente');RAISE EXCEPTION 'PARTIAL_DELETE_RESTORED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='PARTIAL_DELETE_RESTORED' THEN RAISE;END IF;END;
 BEGIN UPDATE public.rotamapa_portfolios SET name='Changed' WHERE user_id=auth.uid() AND id='00000000-0000-4000-8000-000000000033';RAISE EXCEPTION 'PENDING_DELETE_RENAMED';EXCEPTION WHEN OTHERS THEN IF sqlerrm='PENDING_DELETE_RENAMED' THEN RAISE;END IF;END;
END$$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',false);
DELETE FROM storage.objects WHERE bucket_id='rotamapa-catalogs' AND name LIKE '00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000033/%';
DO $$BEGIN BEGIN PERFORM public.rotamapa_portfolio_delete_batch((SELECT (data->>'ticketId')::uuid FROM delete_ticket_fixture));RAISE EXCEPTION 'FOREIGN_DELETE_TICKET';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END$$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
SELECT test.ensure((SELECT count(*)=2 FROM storage.objects WHERE name LIKE '00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000033/%'),'foreign deletion denied');
-- Same owner may complete the explicitly confirmed inactive portfolio without changing the active one.
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000031"}',false);
DELETE FROM storage.objects WHERE bucket_id='rotamapa-catalogs' AND name='00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000033/'||repeat('e',64)||'.pdf';
SELECT test.ensure(jsonb_array_length(public.rotamapa_prepare_portfolio_delete('00000000-0000-4000-8000-000000000033',1,'EXCLUIR Envio pendente')->'paths')=1,'lost response resumes without restoring or duplicating originals');
DELETE FROM storage.objects WHERE bucket_id='rotamapa-catalogs' AND name LIKE '00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000033/%';
SELECT test.ensure(public.rotamapa_finish_portfolio_delete((SELECT (data->>'ticketId')::uuid FROM delete_ticket_fixture),'EXCLUIR Envio pendente')->>'state'='deleted','all originals removed before finalization');
SELECT test.ensure(public.rotamapa_finish_portfolio_delete((SELECT (data->>'ticketId')::uuid FROM delete_ticket_fixture),'EXCLUIR Envio pendente')->>'state'='deleted','finalization retry is idempotent');
SELECT test.ensure((SELECT count(*)=1 FROM storage.objects),'another portfolio original preserved');
RESET ROLE;
SELECT test.ensure((SELECT count(*)>0 FROM public.rotamapa_commerce_items WHERE user_id='00000000-0000-4000-8000-000000000003' AND portfolio_id='00000000-0000-4000-8000-000000000031'),'other portfolio sales preserved');
SELECT 'Resumable original-file deletion, confirmation, RLS and other-portfolio preservation assertions passed' AS result;
