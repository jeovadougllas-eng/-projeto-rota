-- Local disposable Postgres only; roles are provided by the test runner.
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
GRANT USAGE ON SCHEMA auth TO authenticated,anon;
CREATE TABLE public.clients(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users,local_id text,name text,data jsonb,revision bigint DEFAULT 1,deleted_at timestamptz,UNIQUE(user_id,local_id));
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.clients TO authenticated;
CREATE POLICY own_clients ON public.clients FOR ALL TO authenticated USING(user_id=(select auth.uid())) WITH CHECK(user_id=(select auth.uid()));
INSERT INTO auth.users VALUES('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
INSERT INTO public.clients(user_id,local_id,name,data) VALUES('00000000-0000-4000-8000-000000000001','old','Cliente preservado','{"name":"Cliente preservado","lat":-5.8,"lon":-35.2,"locationVerification":"manual_reviewed"}');
CREATE SCHEMA test;
CREATE FUNCTION test.ensure(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%',message;END IF;END;$$;
GRANT USAGE ON SCHEMA test TO authenticated;
