-- Local-only quota assertions. Direct private calls are made as the database owner, never a client.
INSERT INTO public.traxelo_plan_grants(user_id,plan) VALUES('00000000-0000-4000-8000-000000000002','plus');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
SELECT set_config('request.headers','{"x-rotamapa-portfolio":"00000000-0000-4000-8000-000000000102"}',false);
SELECT rotamapa_private.record_pdf_import(auth.uid(),'00000000-0000-4000-8000-000000000102',repeat('a',64));
SELECT rotamapa_private.record_pdf_import(auth.uid(),'00000000-0000-4000-8000-000000000102',repeat('a',64));
SELECT rotamapa_private.record_pdf_import(auth.uid(),'00000000-0000-4000-8000-000000000102',repeat('b',64));
SELECT rotamapa_private.record_pdf_import(auth.uid(),'00000000-0000-4000-8000-000000000102',repeat('c',64));
SELECT test.ensure((public.rotamapa_pdf_import_access()->>'used')::int=3,'same fingerprint is charged once');
DO $$BEGIN BEGIN PERFORM rotamapa_private.record_pdf_import(auth.uid(),'00000000-0000-4000-8000-000000000102',repeat('d',64));RAISE EXCEPTION 'fourth monthly import allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END$$;
SET ROLE authenticated;
DO $$BEGIN BEGIN DELETE FROM rotamapa_private.pdf_import_usage;RAISE EXCEPTION 'client cleared usage';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END$$;
RESET ROLE;
SELECT 'All monthly PDF quota assertions passed' AS result;
