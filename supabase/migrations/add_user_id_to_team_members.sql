-- Add user_id column to team_members to link invited users to their accounts
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Drop existing policies and recreate with user_id support
DROP POLICY IF EXISTS "Users can view own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.team_members;

-- Users can view team members if they own the team OR are a member of the team
CREATE POLICY "Users can view team members" ON public.team_members
  FOR SELECT USING (
    auth.uid() = owner_id 
    OR auth.uid() = user_id
    OR owner_id IN (
      SELECT tm.owner_id FROM public.team_members tm WHERE tm.user_id = auth.uid()
    )
  );

-- Keep existing insert/update/delete policies (only owners can modify)
-- These should already exist, but ensure they're correct
DROP POLICY IF EXISTS "Users can insert own team members" ON public.team_members;
CREATE POLICY "Users can insert own team members" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own team members" ON public.team_members;
CREATE POLICY "Users can update own team members" ON public.team_members
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own team members" ON public.team_members;
CREATE POLICY "Users can delete own team members" ON public.team_members
  FOR DELETE USING (auth.uid() = owner_id);

-- Also allow invited users to update their own member record (e.g., to set avatar)
CREATE POLICY "Users can update their own membership" ON public.team_members
  FOR UPDATE USING (auth.uid() = user_id);

