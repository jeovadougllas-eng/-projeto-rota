-- Keep CAS, owner/portfolio scope and existing revisions while updating editable summaries.
BEGIN;
CREATE OR REPLACE FUNCTION public.traxio_update_client_safe(p_local_id text,p_expected_revision bigint,p_data jsonb)
RETURNS TABLE(result text,current_revision bigint)
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE v_revision bigint;v_lat double precision;v_lon double precision;v_cnpj text;
BEGIN
 IF auth.uid() IS NULL OR coalesce(auth.jwt()->>'is_anonymous','false')='true' THEN RAISE EXCEPTION 'Usuário não autenticado' USING ERRCODE='42501';END IF;
 IF p_local_id IS NULL OR btrim(p_local_id)='' OR p_expected_revision IS NULL OR p_expected_revision<1 OR p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR nullif(btrim(p_data->>'name'),'') IS NULL THEN RAISE EXCEPTION 'Dados inválidos';END IF;
 IF p_data ? 'lat' THEN
  BEGIN v_lat:=(p_data->>'lat')::double precision;EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN v_lat:=NULL;END;
  IF abs(v_lat)>90 OR v_lat::text IN ('NaN','Infinity','-Infinity') THEN v_lat:=NULL;END IF;
 END IF;
 IF p_data ? 'lon' THEN
  BEGIN v_lon:=(p_data->>'lon')::double precision;EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN v_lon:=NULL;END;
  IF abs(v_lon)>180 OR v_lon::text IN ('NaN','Infinity','-Infinity') THEN v_lon:=NULL;END IF;
 END IF;
 IF p_data ? 'cnpj' OR p_data->'manualFields' ? 'cnpj' THEN v_cnpj:=nullif(regexp_replace(CASE WHEN p_data->'manualFields' ? 'cnpj' THEN p_data#>>'{manualFields,cnpj}' ELSE p_data->>'cnpj' END,'[^0-9]','','g'),'');END IF;
 UPDATE public.clients AS c SET data=p_data,name=p_data->>'name',address=p_data->>'address',zip_code=p_data->>'cep',
  cnpj=CASE WHEN p_data ? 'cnpj' OR p_data->'manualFields' ? 'cnpj' THEN v_cnpj ELSE c.cnpj END,
  city=CASE WHEN p_data ? 'city' THEN nullif(btrim(p_data->>'city'),'') ELSE c.city END,
  neighborhood=CASE WHEN p_data ? 'neighborhood' THEN nullif(btrim(p_data->>'neighborhood'),'') ELSE c.neighborhood END,
  latitude=CASE WHEN p_data ? 'lat' THEN v_lat ELSE c.latitude END,
  longitude=CASE WHEN p_data ? 'lon' THEN v_lon ELSE c.longitude END
 WHERE c.user_id=auth.uid() AND c.portfolio_id=public.rotamapa_current_portfolio() AND c.local_id=p_local_id AND c.revision=p_expected_revision AND c.deleted_at IS NULL
 RETURNING c.revision INTO v_revision;
 IF FOUND THEN RETURN QUERY SELECT 'updated'::text,v_revision;ELSE
  RETURN QUERY SELECT 'conflict_or_missing'::text,c.revision FROM public.clients c WHERE c.user_id=auth.uid() AND c.portfolio_id=public.rotamapa_current_portfolio() AND c.local_id=p_local_id AND c.deleted_at IS NULL;
  IF NOT FOUND THEN RETURN QUERY SELECT 'not_found'::text,NULL::bigint;END IF;
 END IF;
END;$$;
REVOKE ALL ON FUNCTION public.traxio_update_client_safe(text,bigint,jsonb) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.traxio_update_client_safe(text,bigint,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
