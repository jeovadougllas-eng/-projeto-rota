-- Private temporary Excel exports for Android's system browser. No public bucket or credentials.
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('traxelo-visit-exports','traxelo-visit-exports',false,20971520,ARRAY['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT(id) DO NOTHING;
DO $setup$
BEGIN
 IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='traxelo-visit-exports' AND public) THEN RAISE EXCEPTION 'Export bucket must be private'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='traxelo_visit_exports_owner_insert') THEN
  CREATE POLICY traxelo_visit_exports_owner_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='traxelo-visit-exports' AND (storage.foldername(name))[1]=(select auth.uid())::text AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='traxelo_visit_exports_owner_select') THEN
  CREATE POLICY traxelo_visit_exports_owner_select ON storage.objects FOR SELECT TO authenticated USING(bucket_id='traxelo-visit-exports' AND (storage.foldername(name))[1]=(select auth.uid())::text AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='traxelo_visit_exports_owner_delete') THEN
  CREATE POLICY traxelo_visit_exports_owner_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='traxelo-visit-exports' AND (storage.foldername(name))[1]=(select auth.uid())::text AND coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
 END IF;
END;
$setup$;
COMMIT;
