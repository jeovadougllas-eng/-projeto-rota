-- Hosted auth already has these columns; local fixture only.
ALTER TABLE auth.users ADD COLUMN raw_app_meta_data jsonb DEFAULT '{}',ADD COLUMN raw_user_meta_data jsonb DEFAULT '{}';
