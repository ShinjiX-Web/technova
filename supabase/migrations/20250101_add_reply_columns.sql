-- Add reply columns to team_messages table
-- This allows users to reply to specific messages with quote preview

ALTER TABLE team_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID,
ADD COLUMN IF NOT EXISTS reply_to_message TEXT,
ADD COLUMN IF NOT EXISTS reply_to_sender TEXT;

-- Add index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_team_messages_reply_to_id ON team_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Enable Realtime for team_messages table
-- This ensures messages appear instantly for all users
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;

-- Enable Realtime for private_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE private_messages;

-- Enable Realtime for message_reactions table
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Note: If you get an error "relation already exists in publication", 
-- that means realtime is already enabled. You can ignore that error.

