-- Message Reactions Table
-- For emoji/sticker reactions on team messages

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,  -- References team_messages.id
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  reaction_type TEXT NOT NULL,  -- 'emoji', 'gif', 'sticker'
  reaction_value TEXT NOT NULL, -- The actual emoji/gif URL/sticker URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_value)  -- One reaction per user per emoji per message
);

-- Create indexes for faster queries
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Disable RLS since we use Firebase Auth
ALTER TABLE public.message_reactions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.message_reactions TO anon;
GRANT ALL ON public.message_reactions TO authenticated;

-- Also add reactions support to private_messages
CREATE TABLE IF NOT EXISTS public.private_message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,  -- References private_messages.id
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  reaction_type TEXT NOT NULL,
  reaction_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_value)
);

CREATE INDEX idx_private_message_reactions_message_id ON public.private_message_reactions(message_id);
ALTER TABLE public.private_message_reactions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.private_message_reactions TO anon;
GRANT ALL ON public.private_message_reactions TO authenticated;

