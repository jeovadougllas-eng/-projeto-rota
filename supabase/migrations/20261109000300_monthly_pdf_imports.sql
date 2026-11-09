-- DRAFT. Successful import operations only; existing records are neither changed nor charged retroactively.
BEGIN;
CREATE TABLE rotamapa_private.pdf_import_usage (
 user_id uuid NOT NULL,portfolio_id uuid NOT NULL,month date NOT NULL,
 fingerprint text NOT NULL CHECK(fingerprint ~ '^[a-f0-9]{64}$'),imported_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,portfolio_id,month,fingerprint),
 FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id)
);
ALTER TABLE rotamapa_private.pdf_import_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rotamapa_private.pdf_import_usage FROM public,anon,authenticated;
CREATE FUNCTION rotamapa_private.record_pdf_import(p_owner uuid,p_portfolio uuid,p_fingerprint text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();period date:=date_trunc('month',timezone('America/Fortaleza',now()))::date;access jsonb;total integer;
BEGIN
 IF who IS DISTINCT FROM p_owner OR who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Conta inválida.' USING ERRCODE='42501';END IF;
 IF p_fingerprint IS NULL OR p_fingerprint !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Identificador do documento inválido.' USING ERRCODE='22023';END IF;
 PERFORM 1 FROM public.rotamapa_portfolios WHERE user_id=who AND id=p_portfolio FOR SHARE;
 IF NOT FOUND OR EXISTS(SELECT 1 FROM rotamapa_private.portfolio_lifecycle WHERE user_id=who AND portfolio_id=p_portfolio) THEN RAISE EXCEPTION 'Carteira indisponível.' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(who::text||':'||p_portfolio::text||':'||period::text||':pdf',0));
 IF EXISTS(SELECT 1 FROM rotamapa_private.pdf_import_usage WHERE user_id=who AND portfolio_id=p_portfolio AND month=period AND fingerprint=p_fingerprint) THEN RETURN;END IF;
 access:=traxelo_private.portfolio_plan_access();
 IF access->>'plan'='free' THEN RAISE EXCEPTION 'Importação de PDF disponível nos planos Executivo e Elite.' USING ERRCODE='42501';END IF;
 SELECT count(*) INTO total FROM rotamapa_private.pdf_import_usage WHERE user_id=who AND portfolio_id=p_portfolio AND month=period;
 IF access->>'plan'='plus' AND total>=3 THEN RAISE EXCEPTION 'Limite de 3 importações de PDF por mês nesta carteira atingido. Os documentos existentes foram preservados.' USING ERRCODE='42501';END IF;
 INSERT INTO rotamapa_private.pdf_import_usage(user_id,portfolio_id,month,fingerprint) VALUES(who,p_portfolio,period,p_fingerprint);
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.record_pdf_import(uuid,uuid,text) FROM public,anon,authenticated;
CREATE FUNCTION rotamapa_private.invoice_pdf_usage() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE fingerprints text;document jsonb;
BEGIN
 IF new.kind<>'sale' OR NOT(new.data ? 'source') OR new.data->>'status'<>'confirmed' THEN RETURN new;END IF;
 IF TG_OP='UPDATE' AND new.data->'source' IS NOT DISTINCT FROM old.data->'source' THEN RETURN new;END IF;
 IF jsonb_typeof(new.data#>'{source,receipts}') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Origem dos PDFs inválida.';END IF;
 FOR document IN SELECT value FROM jsonb_array_elements(new.data#>'{source,receipts}') LOOP
  IF coalesce(document->>'sha256','') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Hash de PDF inválido.';END IF;
 END LOOP;
 SELECT string_agg(DISTINCT value->>'sha256',',' ORDER BY value->>'sha256') INTO fingerprints FROM jsonb_array_elements(new.data#>'{source,receipts}');
 PERFORM rotamapa_private.record_pdf_import(new.user_id,new.portfolio_id,encode(sha256(convert_to(fingerprints,'UTF8')),'hex'));
 RETURN new;
END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.invoice_pdf_usage() FROM public,anon,authenticated;
CREATE TRIGGER aaz_pdf_monthly_limit BEFORE INSERT OR UPDATE ON public.rotamapa_commerce_items FOR EACH ROW EXECUTE FUNCTION rotamapa_private.invoice_pdf_usage();
CREATE FUNCTION public.rotamapa_pdf_import_access() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE who uuid:=auth.uid();portfolio uuid:=public.rotamapa_current_portfolio();period date:=date_trunc('month',timezone('America/Fortaleza',now()))::date;access jsonb;used integer;
BEGIN
 IF who IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Entre na sua conta.' USING ERRCODE='42501';END IF;
 access:=traxelo_private.portfolio_plan_access();SELECT count(*) INTO used FROM rotamapa_private.pdf_import_usage WHERE user_id=who AND portfolio_id=portfolio AND month=period;
 RETURN jsonb_build_object('month',period,'used',used,'limit',CASE access->>'plan' WHEN 'plus' THEN 3 WHEN 'free' THEN 0 ELSE NULL END,'timeZone','America/Fortaleza');
END;$$;
REVOKE ALL ON FUNCTION public.rotamapa_pdf_import_access() FROM public,anon;
GRANT EXECUTE ON FUNCTION public.rotamapa_pdf_import_access() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
