-- Add last_seen column for presence tracking
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for presence queries
CREATE INDEX IF NOT EXISTS idx_team_members_last_seen ON public.team_members(last_seen);

