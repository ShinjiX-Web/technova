-- Add pin and soft delete columns to team_messages table
-- This allows users to pin important messages and soft-delete messages with a trace

-- First check if columns exist and add them if not
DO $$
BEGIN
    -- team_messages columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_messages' AND column_name = 'is_pinned') THEN
        ALTER TABLE team_messages ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_messages' AND column_name = 'pinned_at') THEN
        ALTER TABLE team_messages ADD COLUMN pinned_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_messages' AND column_name = 'pinned_by') THEN
        ALTER TABLE team_messages ADD COLUMN pinned_by TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_messages' AND column_name = 'is_deleted') THEN
        ALTER TABLE team_messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE team_messages ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    -- private_messages columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_messages' AND column_name = 'is_pinned') THEN
        ALTER TABLE private_messages ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_messages' AND column_name = 'pinned_at') THEN
        ALTER TABLE private_messages ADD COLUMN pinned_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_messages' AND column_name = 'pinned_by') THEN
        ALTER TABLE private_messages ADD COLUMN pinned_by TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_messages' AND column_name = 'is_deleted') THEN
        ALTER TABLE private_messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'private_messages' AND column_name = 'deleted_at') THEN
        ALTER TABLE private_messages ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add index for faster pinned message lookups (only create if not exists)
CREATE INDEX IF NOT EXISTS idx_team_messages_pinned ON team_messages(owner_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_private_messages_pinned ON private_messages(team_owner_id, is_pinned) WHERE is_pinned = TRUE;

