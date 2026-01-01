-- Chat Enhancements Migration
-- Adds support for file sharing, nicknames, themes, and admin controls
-- NOTE: This app uses Firebase Auth, so user_id is TEXT (not UUID)

-- Add new columns to team_members for chat blocking and nicknames
ALTER TABLE team_members
ADD COLUMN IF NOT EXISTS is_chat_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS chat_nickname TEXT;

-- Add new columns to team_messages for file attachments
ALTER TABLE team_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Add status column to chat_settings if table exists
-- The table should already exist from add_chat_features.sql with user_id as TEXT
ALTER TABLE chat_settings
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Available';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_messages_file_url ON team_messages(file_url) WHERE file_url IS NOT NULL;

