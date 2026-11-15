BEGIN;
CREATE TABLE public.rotamapa_notes (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 portfolio_id uuid NOT NULL,
 id uuid NOT NULL,
 title text NOT NULL DEFAULT '' CHECK(char_length(title)<=120),
 body text NOT NULL DEFAULT '' CHECK(char_length(body)<=60000),
 deleted boolean NOT NULL DEFAULT false,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,portfolio_id,id),
 FOREIGN KEY(user_id,portfolio_id) REFERENCES public.rotamapa_portfolios(user_id,id) ON DELETE CASCADE
);
ALTER TABLE public.rotamapa_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_owner ON public.rotamapa_notes FOR ALL TO authenticated
 USING(user_id=(select auth.uid()) AND portfolio_id=(select public.rotamapa_current_portfolio()) AND coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true')
 WITH CHECK(user_id=(select auth.uid()) AND portfolio_id=(select public.rotamapa_current_portfolio()) AND coalesce((select auth.jwt()->>'is_anonymous'),'false')<>'true');
REVOKE ALL ON public.rotamapa_notes FROM public,anon,authenticated;
GRANT SELECT ON public.rotamapa_notes TO authenticated;
GRANT INSERT(user_id,portfolio_id,id,title,body,deleted) ON public.rotamapa_notes TO authenticated;
GRANT UPDATE(title,body,deleted) ON public.rotamapa_notes TO authenticated;
CREATE FUNCTION rotamapa_private.notes_revision() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN NEW.revision:=OLD.revision+1;NEW.updated_at:=now();RETURN NEW;END;$$;
REVOKE ALL ON FUNCTION rotamapa_private.notes_revision() FROM public,anon,authenticated;
CREATE TRIGGER aaa_portfolio_guard BEFORE INSERT OR UPDATE ON public.rotamapa_notes FOR EACH ROW EXECUTE FUNCTION rotamapa_private.ensure_portfolio();
CREATE TRIGGER notes_revision BEFORE UPDATE ON public.rotamapa_notes FOR EACH ROW EXECUTE FUNCTION rotamapa_private.notes_revision();
NOTIFY pgrst,'reload schema';
COMMIT;
