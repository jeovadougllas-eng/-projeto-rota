-- Private, account-wide profile photos. Does not change customers, portfolios or history.
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('rotamapa-avatars','rotamapa-avatars',false,1048576,ARRAY['image/jpeg'])
ON CONFLICT(id) DO NOTHING;
DO $check$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='rotamapa-avatars' AND public=false AND file_size_limit=1048576 AND allowed_mime_types=ARRAY['image/jpeg']) THEN
  RAISE EXCEPTION 'O armazenamento rotamapa-avatars já existe com outra configuração. Confira antes de ativar o perfil.';
 END IF;
END;$check$;
-- Restrictive boundaries also protect this bucket from unrelated permissive policies.
CREATE POLICY rotamapa_avatar_boundary ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING(bucket_id<>'rotamapa-avatars' OR (coalesce((select auth.jwt())->>'is_anonymous','false')='false' AND name ~ ('^'||(select auth.uid())::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$')))
WITH CHECK(bucket_id<>'rotamapa-avatars' OR (coalesce((select auth.jwt())->>'is_anonymous','false')='false' AND name ~ ('^'||(select auth.uid())::text||'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$')));
CREATE POLICY rotamapa_avatar_anon_boundary ON storage.objects AS RESTRICTIVE FOR ALL TO anon
USING(bucket_id<>'rotamapa-avatars') WITH CHECK(bucket_id<>'rotamapa-avatars');
CREATE POLICY rotamapa_avatar_read ON storage.objects FOR SELECT TO authenticated
USING(bucket_id='rotamapa-avatars' AND coalesce((select auth.jwt())->>'is_anonymous','false')='false' AND (storage.foldername(name))[1]=(select auth.uid())::text);
CREATE POLICY rotamapa_avatar_upload ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='rotamapa-avatars' AND coalesce((select auth.jwt())->>'is_anonymous','false')='false' AND (storage.foldername(name))[1]=(select auth.uid())::text);
CREATE POLICY rotamapa_avatar_remove ON storage.objects FOR DELETE TO authenticated
USING(bucket_id='rotamapa-avatars' AND coalesce((select auth.jwt())->>'is_anonymous','false')='false' AND (storage.foldername(name))[1]=(select auth.uid())::text);
COMMIT;
