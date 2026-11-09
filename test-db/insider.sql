-- Synthetic assertions; this file intentionally creates local test memberships only.
CREATE FUNCTION test_assert(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%',label;END IF;END$$;
SELECT test_assert((SELECT count(*)=0 FROM rotamapa_private.insider_memberships),'migration must activate zero people');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000008',false);
SELECT test_assert(traxelo_private.portfolio_plan_access()->>'signature'='true','Signature preserved');
INSERT INTO rotamapa_private.insider_memberships(slot,user_id) SELECT n,('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(1,5)n;
DO $$BEGIN
 BEGIN INSERT INTO rotamapa_private.insider_memberships VALUES(6,'00000000-0000-4000-8000-000000000006',now());RAISE EXCEPTION 'sixth slot allowed';EXCEPTION WHEN check_violation THEN NULL;END;
 BEGIN INSERT INTO rotamapa_private.insider_memberships VALUES(0,'00000000-0000-4000-8000-000000000006',now());RAISE EXCEPTION 'zero slot allowed';EXCEPTION WHEN check_violation THEN NULL;END;
 BEGIN UPDATE rotamapa_private.insider_memberships SET user_id='00000000-0000-4000-8000-000000000001' WHERE slot=2;RAISE EXCEPTION 'duplicate person allowed';EXCEPTION WHEN unique_violation THEN NULL;END;
END$$;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT test_assert(traxelo_private.portfolio_plan_access()->>'plan'='pro' AND traxelo_private.portfolio_plan_access()->>'insider'='true' AND traxelo_private.portfolio_plan_access()->'routeLimit'='null'::jsonb,'Insider permanent Elite');
DO $$BEGIN
 BEGIN INSERT INTO rotamapa_private.insider_memberships VALUES(1,auth.uid(),now());RAISE EXCEPTION 'client activation allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN DELETE FROM rotamapa_private.insider_memberships;RAISE EXCEPTION 'client delete allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM * FROM rotamapa_private.insider_memberships;RAISE EXCEPTION 'other members disclosed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END$$;
RESET ROLE;
UPDATE auth.users SET raw_user_meta_data='{"insider":true,"rotamapa_membership":"insider"}' WHERE id='00000000-0000-4000-8000-000000000006';
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000006',false);
SELECT test_assert(traxelo_private.portfolio_plan_access()->>'plan'='free' AND traxelo_private.portfolio_plan_access()->>'insider'='false','metadata cannot grant Insider');
INSERT INTO rotamapa_private.qa_accounts VALUES('00000000-0000-4000-8000-000000000001','free',now()+interval '1 day');
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
SELECT test_assert(traxelo_private.portfolio_plan_access()->>'plan'='free' AND traxelo_private.portfolio_plan_access()->>'insider'='false','QA cannot masquerade as permanent Insider');
SELECT set_config('request.jwt.claims','{"is_anonymous":true}',false);
DO $$BEGIN BEGIN PERFORM traxelo_private.portfolio_plan_access();RAISE EXCEPTION 'anonymous access allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END$$;
SELECT 'All Insider database assertions passed' AS result;
