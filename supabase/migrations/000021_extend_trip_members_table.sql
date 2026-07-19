-- Migration: Extend trip_members table with roles and RSVP functionality
-- Description: Add role-based permissions, RSVP status tracking, and reminder system
-- Dependencies: 000004_create_trip_members_table, 000003_create_trips_table
-- Requirements: 2.1, 2.3, 3.1, 3.2, 7.1

-- Add new columns to trip_members table
ALTER TABLE trip_members
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'member' CHECK (role IN ('owner', 'co_organizer', 'member')),
  ADD COLUMN IF NOT EXISTS rsvp_status text DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'going', 'maybe', 'not_going', 'removed')),
  ADD COLUMN IF NOT EXISTS rsvp_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Add indexes for performance on role and rsvp_status
CREATE INDEX IF NOT EXISTS idx_trip_members_role ON trip_members(role);
CREATE INDEX IF NOT EXISTS idx_trip_members_rsvp_status ON trip_members(rsvp_status);

-- Create trigger function to automatically update rsvp_updated_at when rsvp_status changes
CREATE OR REPLACE FUNCTION update_rsvp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rsvp_status IS DISTINCT FROM OLD.rsvp_status THEN
    NEW.rsvp_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on trip_members table
DROP TRIGGER IF EXISTS trigger_update_rsvp_timestamp ON trip_members;
CREATE TRIGGER trigger_update_rsvp_timestamp
BEFORE UPDATE ON trip_members
FOR EACH ROW
EXECUTE FUNCTION update_rsvp_timestamp();

-- Backfill owner role for existing trip creators
-- This ensures that users who created trips become owners automatically
UPDATE trip_members tm
SET role = 'owner'
FROM trips t
WHERE tm.trip_id = t.id
  AND tm.user_id = t.created_by
  AND tm.role = 'member';

-- Add comments for documentation
COMMENT ON COLUMN trip_members.role IS 'User role in trip: owner (creator), co_organizer (shared management), or member';
COMMENT ON COLUMN trip_members.rsvp_status IS 'Member attendance status: pending, going, maybe, not_going, or removed';
COMMENT ON COLUMN trip_members.rsvp_updated_at IS 'Timestamp of last RSVP status change (auto-updated by trigger)';
COMMENT ON COLUMN trip_members.reminder_sent_at IS 'Timestamp of last RSVP reminder sent to this member';
COMMENT ON FUNCTION update_rsvp_timestamp() IS 'Trigger function to automatically set rsvp_updated_at when rsvp_status changes';
