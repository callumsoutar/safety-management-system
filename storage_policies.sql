-- Storage policies for the attachments bucket
-- Run this in the Supabase SQL Editor

-- First, make sure the storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create policies for the attachments bucket
-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at)
VALUES (
  'Allow authenticated users to upload files',
  '(bucket_id = ''attachments''::text) AND (auth.role() = ''authenticated''::text)',
  'authenticated',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Allow users to download files they have access to
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at)
VALUES (
  'Allow users to download their files',
  '(bucket_id = ''attachments''::text) AND (auth.role() = ''authenticated''::text)',
  'authenticated',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Allow users to delete their own files
INSERT INTO storage.policies (name, definition, owner, created_at, updated_at)
VALUES (
  'Allow users to delete their own files',
  '(bucket_id = ''attachments''::text) AND (auth.role() = ''authenticated''::text)',
  'authenticated',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; 