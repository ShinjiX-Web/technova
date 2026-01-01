-- Drop existing table if exists
DROP TABLE IF EXISTS public.team_messages CASCADE;

-- Create team_messages table for team chat
CREATE TABLE public.team_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_team_messages_owner_id ON public.team_messages(owner_id);
CREATE INDEX idx_team_messages_created_at ON public.team_messages(created_at);

-- IMPORTANT: Since this app uses Firebase Auth (not Supabase Auth),
-- auth.uid() is always null. We disable RLS and rely on client-side filtering.
-- For production, consider using Supabase Auth or a service role key with server-side API.
ALTER TABLE public.team_messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON public.team_messages TO anon;
GRANT ALL ON public.team_messages TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

