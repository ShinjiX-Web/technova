-- Chat Enhancements Migration
-- Adds support for file sharing, nicknames, themes, and admin controls

-- Add new columns to team_members for chat blocking and nicknames
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS is_chat_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS chat_nickname TEXT;

-- Add new columns to team_messages for file attachments
ALTER TABLE team_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Create chat_settings table for user preferences
CREATE TABLE IF NOT EXISTS chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_theme TEXT DEFAULT 'default',
  nickname TEXT,
  status TEXT DEFAULT 'Available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on chat_settings
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_settings
CREATE POLICY "Users can view their own chat settings"
  ON chat_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat settings"
  ON chat_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat settings"
  ON chat_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for chat files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-files bucket
CREATE POLICY "Authenticated users can upload chat files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can view chat files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'chat-files');

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_settings_user_id ON chat_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_file_url ON team_messages(file_url) WHERE file_url IS NOT NULL;

