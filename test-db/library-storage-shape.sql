-- Minimal Storage schema for isolated SQL assertions only. Hosted Storage is not contacted.
CREATE SCHEMA storage;
CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,bucket_id text REFERENCES storage.buckets(id),name text,UNIQUE(bucket_id,name));
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated;
