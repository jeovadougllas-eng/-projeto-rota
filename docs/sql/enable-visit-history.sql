-- Traxelo.IA: individual visit history. Run in the project's Supabase SQL Editor.
-- Adds a separate table. Does not update, delete, recreate or seed any customer record.
BEGIN;
CREATE TABLE IF NOT EXISTS public.traxelo_visit_events (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  id uuid NOT NULL,
  client_id text NOT NULL CHECK(length(client_id) BETWEEN 1 AND 250),
  visit_date date NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','confirmed','void')),
  data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND data ?& ARRAY['id','clientId','visitDate','status'] AND octet_length(data::text)<=131072),
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id,id),
  CHECK(data->>'id'=id::text),
  CHECK(data->>'clientId'=client_id),
  CHECK(data->>'visitDate'=visit_date::text),
  CHECK(data->>'status'=status)
);
CREATE INDEX IF NOT EXISTS traxelo_visit_events_month_idx ON public.traxelo_visit_events(user_id,visit_date,id);
ALTER TABLE public.traxelo_visit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.traxelo_visit_events FROM anon, authenticated;
GRANT SELECT,INSERT ON public.traxelo_visit_events TO authenticated;
GRANT UPDATE(data,status,visit_date,client_id,revision,updated_at) ON public.traxelo_visit_events TO authenticated;
DO $policies$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='traxelo_visit_events' AND policyname='traxelo_visits_owner_select') THEN
  CREATE POLICY traxelo_visits_owner_select ON public.traxelo_visit_events FOR SELECT TO authenticated USING ((select auth.uid())=user_id AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='traxelo_visit_events' AND policyname='traxelo_visits_owner_insert') THEN
  CREATE POLICY traxelo_visits_owner_insert ON public.traxelo_visit_events FOR INSERT TO authenticated WITH CHECK ((select auth.uid())=user_id AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='traxelo_visit_events' AND policyname='traxelo_visits_owner_update') THEN
  CREATE POLICY traxelo_visits_owner_update ON public.traxelo_visit_events FOR UPDATE TO authenticated USING ((select auth.uid())=user_id AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true') WITH CHECK ((select auth.uid())=user_id AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
 END IF;
END;
$policies$;
NOTIFY pgrst, 'reload schema';
COMMIT;
