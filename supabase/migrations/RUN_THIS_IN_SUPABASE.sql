-- =====================================================
-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR
-- This creates missing tables and columns for chat features
-- =====================================================

-- 1. Create chat_settings table for user preferences (themes, nicknames, status)
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  chat_theme TEXT DEFAULT 'default',
  nickname TEXT,
  status TEXT DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for chat_settings (using Firebase Auth)
ALTER TABLE public.chat_settings DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.chat_settings TO anon;
GRANT ALL ON public.chat_settings TO authenticated;

-- Create index for chat_settings
CREATE INDEX IF NOT EXISTS idx_chat_settings_user_id ON public.chat_settings(user_id);

-- 2. Create private_messages table for direct messages
CREATE TABLE IF NOT EXISTS public.private_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_owner_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  reply_to_id UUID,
  reply_to_message TEXT,
  reply_to_sender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for private_messages
ALTER TABLE public.private_messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.private_messages TO anon;
GRANT ALL ON public.private_messages TO authenticated;

-- Create indexes for private_messages
CREATE INDEX IF NOT EXISTS idx_private_messages_team_owner ON public.private_messages(team_owner_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON public.private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON public.private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON public.private_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON public.private_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_private_messages_unread ON public.private_messages(receiver_id, is_read) WHERE is_read = FALSE;

-- 3. Create message_reactions table for emoji reactions
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  message_type TEXT DEFAULT 'team',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Disable RLS for message_reactions
ALTER TABLE public.message_reactions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.message_reactions TO anon;
GRANT ALL ON public.message_reactions TO authenticated;

-- Create indexes for message_reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- 4. Add missing columns to team_members (if they don't exist)
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS is_chat_blocked BOOLEAN DEFAULT FALSE;

ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS chat_nickname TEXT;

-- 5. Add missing columns to team_messages (if they don't exist)
ALTER TABLE public.team_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT;

ALTER TABLE public.team_messages 
ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE public.team_messages 
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Done! All tables and columns should now be created.
SELECT 'Migration completed successfully!' as status;

