-- Add chat features to team_members table

-- Add nickname for chat display
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS chat_nickname TEXT;

-- Add blocklist status (for admin to block users from chatting)
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS is_chat_blocked BOOLEAN DEFAULT FALSE;

-- Add file_url and file_name to team_messages for file attachments
ALTER TABLE public.team_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Create chat_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  chat_theme TEXT DEFAULT 'default',
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for chat_settings
CREATE INDEX IF NOT EXISTS idx_chat_settings_user_id ON public.chat_settings(user_id);

-- Disable RLS for chat_settings (same as team_messages - using Firebase Auth)
ALTER TABLE public.chat_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.chat_settings TO anon;
GRANT ALL ON public.chat_settings TO authenticated;

