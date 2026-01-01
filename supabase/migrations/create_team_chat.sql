-- Create team_messages table for team chat
CREATE TABLE IF NOT EXISTS public.team_messages (
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
CREATE INDEX IF NOT EXISTS idx_team_messages_owner_id ON public.team_messages(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON public.team_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages in their team (where they are owner or member)
CREATE POLICY "Users can view team messages" ON public.team_messages
  FOR SELECT USING (
    auth.uid()::text = owner_id
    OR auth.uid()::text IN (
      SELECT tm.user_id FROM public.team_members tm WHERE tm.owner_id = team_messages.owner_id
    )
  );

-- Policy: Team members can insert messages
CREATE POLICY "Team members can send messages" ON public.team_messages
  FOR INSERT WITH CHECK (
    auth.uid()::text = owner_id
    OR auth.uid()::text IN (
      SELECT tm.user_id FROM public.team_members tm WHERE tm.owner_id = team_messages.owner_id
    )
  );

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON public.team_messages
  FOR DELETE USING (auth.uid()::text = sender_id);

