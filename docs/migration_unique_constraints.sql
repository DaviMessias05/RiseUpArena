-- ============================================
-- MIGRATION: Add unique constraints for email, username, CPF
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Add CPF column to profiles (was only in raw_user_meta_data)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(11);

-- 2. Backfill CPF from auth.users raw_user_meta_data
UPDATE profiles p
SET cpf = u.raw_user_meta_data->>'cpf'
FROM auth.users u
WHERE p.id = u.id
  AND u.raw_user_meta_data->>'cpf' IS NOT NULL
  AND p.cpf IS NULL;

-- 3. Add UNIQUE constraint on email (already unique in auth.users, but enforce in profiles too)
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 4. Add UNIQUE constraint on CPF
ALTER TABLE profiles ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);

-- 5. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- 6. Update the trigger to also store CPF when creating profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, display_name, avatar_url, email_verified, cpf)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTR(NEW.id::TEXT, 1, 6)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    NEW.raw_user_meta_data->>'cpf'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
