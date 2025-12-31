-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Member',
  position TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Active', 'Away', 'Offline', 'Pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON public.team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
-- Users can view their own team members
CREATE POLICY "Users can view own team members" ON public.team_members
  FOR SELECT USING (auth.uid() = owner_id);

-- Users can insert their own team members
CREATE POLICY "Users can insert own team members" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update their own team members
CREATE POLICY "Users can update own team members" ON public.team_members
  FOR UPDATE USING (auth.uid() = owner_id);

-- Users can delete their own team members
CREATE POLICY "Users can delete own team members" ON public.team_members
  FOR DELETE USING (auth.uid() = owner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_team_members_updated_at ON public.team_members;
CREATE TRIGGER set_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

