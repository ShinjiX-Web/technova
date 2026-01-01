-- Private/Direct Messages Table
-- For 1-on-1 conversations between team members

CREATE TABLE IF NOT EXISTS public.private_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_owner_id TEXT NOT NULL,  -- The team context (owner's ID)
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  reply_to_id UUID,  -- Reference to the message being replied to
  reply_to_message TEXT,  -- Preview of the original message
  reply_to_sender TEXT,  -- Name of the original sender
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_private_messages_team_owner ON public.private_messages(team_owner_id);
CREATE INDEX idx_private_messages_sender ON public.private_messages(sender_id);
CREATE INDEX idx_private_messages_receiver ON public.private_messages(receiver_id);
CREATE INDEX idx_private_messages_conversation ON public.private_messages(sender_id, receiver_id);
CREATE INDEX idx_private_messages_created_at ON public.private_messages(created_at);
CREATE INDEX idx_private_messages_unread ON public.private_messages(receiver_id, is_read) WHERE is_read = FALSE;

-- Disable RLS since we use Firebase Auth
ALTER TABLE public.private_messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.private_messages TO anon;
GRANT ALL ON public.private_messages TO authenticated;

