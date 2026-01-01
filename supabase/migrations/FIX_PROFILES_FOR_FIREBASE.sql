-- =====================================================
-- FIX PROFILES TABLE FOR FIREBASE AUTH
-- Firebase uses TEXT IDs, not UUIDs
-- =====================================================

-- Option 1: If you want to recreate the profiles table (DESTRUCTIVE - loses existing data)
-- Uncomment the following lines if you want to recreate:

-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- CREATE TABLE public.profiles (
--   id TEXT PRIMARY KEY,
--   name TEXT,
--   email TEXT,
--   avatar_url TEXT,
--   oauth_provider TEXT,
--   last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Option 2: Alter the existing id column from UUID to TEXT
-- This is safer but may fail if there are foreign key constraints

-- First, drop any policies that might interfere
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Change the id column type from UUID to TEXT
-- NOTE: This will fail if there's existing data with UUID format
-- If it fails, use Option 1 above (recreate table)
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;

-- Disable RLS since we use Firebase Auth (not Supabase Auth)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;

-- Add last_seen column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add oauth_provider column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen);

SELECT 'Profiles table fixed for Firebase Auth!' as status;

