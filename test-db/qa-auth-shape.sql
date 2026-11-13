-- The hosted Auth table already has these fields. Disposable fixtures only.
ALTER TABLE auth.users ADD COLUMN email text,ADD COLUMN email_confirmed_at timestamptz;
UPDATE auth.users SET email=CASE WHEN id='00000000-0000-4000-8000-000000000001' THEN 'operator@example.test' ELSE 'tester@example.test' END,email_confirmed_at=now();
