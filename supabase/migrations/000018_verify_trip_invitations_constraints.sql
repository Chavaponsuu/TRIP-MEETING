-- Migration: Verify and extend trip_invitations table constraints
-- Description: Ensure unique constraint and status check constraint exist for data integrity
-- Dependencies: 000014_create_trip_invitations_table
-- Task: 1.4 - Requirements 6.1, 6.2

-- Verify/add unique constraint on (trip_id, invitee_id)
-- This prevents the same user from being invited to the same trip multiple times
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trip_invitations_trip_id_invitee_id_key'
    AND conrelid = 'trip_invitations'::regclass
  ) THEN
    ALTER TABLE trip_invitations 
    ADD CONSTRAINT trip_invitations_trip_id_invitee_id_key 
    UNIQUE (trip_id, invitee_id);
    
    RAISE NOTICE 'Added unique constraint trip_invitations_trip_id_invitee_id_key';
  ELSE
    RAISE NOTICE 'Unique constraint trip_invitations_trip_id_invitee_id_key already exists';
  END IF;
END $$;

-- Verify/add status check constraint for pending/accepted/declined
-- This ensures invitation status can only be one of the three valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trip_invitations_status_check'
    AND conrelid = 'trip_invitations'::regclass
  ) THEN
    ALTER TABLE trip_invitations 
    ADD CONSTRAINT trip_invitations_status_check 
    CHECK (status IN ('pending', 'accepted', 'declined'));
    
    RAISE NOTICE 'Added check constraint trip_invitations_status_check';
  ELSE
    RAISE NOTICE 'Check constraint trip_invitations_status_check already exists';
  END IF;
END $$;

-- Verify that the table has the expected structure
DO $$
DECLARE
  missing_columns text[];
BEGIN
  SELECT ARRAY_AGG(column_name)
  INTO missing_columns
  FROM (VALUES 
    ('id'), 
    ('trip_id'), 
    ('inviter_id'), 
    ('invitee_id'), 
    ('status'), 
    ('created_at')
  ) AS expected(column_name)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'trip_invitations' 
    AND column_name = expected.column_name
  );
  
  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'trip_invitations table is missing columns: %', missing_columns;
  ELSE
    RAISE NOTICE 'trip_invitations table structure verified successfully';
  END IF;
END $$;

-- Add comment documenting this verification migration
COMMENT ON TABLE trip_invitations IS 'Direct trip invitations from members to friends. Constraints verified by migration 000018.';
