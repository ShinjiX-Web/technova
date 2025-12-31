-- Add owner info columns to team_members for display purposes
-- This allows team members to see who owns the team without needing a separate profile lookup

ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS owner_avatar TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_owner_email ON public.team_members(owner_email);

