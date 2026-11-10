-- DRAFT. Adds invoice-date validation; historical confirmations and sale contents are untouched.
BEGIN;
DO $migration$
DECLARE source text:=pg_get_functiondef('rotamapa_private.validate_commerce()'::regprocedure);anchor text:='IF TG_OP=''UPDATE'' AND old.data ? ''manualBilling''';
BEGIN
 IF strpos(source,anchor)=0 THEN RAISE EXCEPTION 'Manual billing validator differs; review before migration.';END IF;
 source:=replace(source,anchor,$guard$
   IF b ? 'invoiceDate' THEN
    IF coalesce(b->>'invoiceDate','') !~ '^\d{4}-\d{2}-\d{2}$' OR (b->>'invoiceDate')::date>(now() AT TIME ZONE 'America/Fortaleza')::date OR coalesce(b->>'invoiceNumber','') !~ '^[0-9]{0,30}$' THEN RAISE EXCEPTION 'Confira a data do faturamento e a nota fiscal.';END IF;
   END IF;
   $guard$||anchor);
 EXECUTE source;
END;$migration$;
NOTIFY pgrst,'reload schema';
COMMIT;
