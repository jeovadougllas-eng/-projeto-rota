-- Disposable local fixture only. Never run against Supabase.
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
CREATE SCHEMA auth; CREATE SCHEMA traxelo_private; CREATE SCHEMA rotamapa_private;
CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_app_meta_data jsonb DEFAULT '{}',raw_user_meta_data jsonb DEFAULT '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
GRANT USAGE ON SCHEMA auth,traxelo_private TO authenticated;
CREATE TABLE public.traxelo_plan_grants(user_id uuid PRIMARY KEY,plan text,expires_at timestamptz);
CREATE TABLE public.traxelo_release_access(singleton boolean,beta_pro boolean);
CREATE TABLE public.traxelo_workspace_items(user_id uuid,kind text,deleted boolean);
CREATE TABLE public.rotamapa_portfolios(user_id uuid);
CREATE TABLE rotamapa_private.qa_accounts(user_id uuid,plan text,expires_at timestamptz);
CREATE TABLE rotamapa_private.qa_operators(user_id uuid);
INSERT INTO auth.users(id) SELECT ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid FROM generate_series(1,8) n;
UPDATE auth.users SET raw_app_meta_data='{"rotamapa_membership":"signature_founder"}' WHERE id='00000000-0000-4000-8000-000000000008';
INSERT INTO public.traxelo_plan_grants VALUES('00000000-0000-4000-8000-000000000008','pro',NULL);
INSERT INTO public.traxelo_release_access VALUES(true,false);
