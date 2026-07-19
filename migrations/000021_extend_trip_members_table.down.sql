-- Rollback: Remove trip_members table extensions
-- WARNING: This will permanently delete role, RSVP, and reminder data

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_rsvp_timestamp ON trip_members;
DROP FUNCTION IF EXISTS update_rsvp_timestamp();

-- Drop indexes
DROP INDEX IF EXISTS idx_trip_members_role;
DROP INDEX IF EXISTS idx_trip_members_rsvp_status;

-- Drop columns
ALTER TABLE trip_members
  DROP COLUMN IF EXISTS reminder_sent_at,
  DROP COLUMN IF EXISTS rsvp_updated_at,
  DROP COLUMN IF EXISTS rsvp_status,
  DROP COLUMN IF EXISTS role;
