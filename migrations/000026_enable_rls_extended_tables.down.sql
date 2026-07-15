-- Migration: Rollback RLS policies for trips and trip_members
-- Description: Reverts policies and helper functions to original state

DROP TRIGGER IF EXISTS trigger_validate_member_role_update ON trip_members;
DROP FUNCTION IF EXISTS validate_member_role_update();

DROP POLICY IF EXISTS "Members can update own RSVP" ON trip_members;
DROP POLICY IF EXISTS "Owner/co-organizer can update trip" ON trips;

-- Recreate original update policy for trips
CREATE POLICY "Creator can update trip" ON trips FOR UPDATE
  USING (created_by = auth.uid());

-- Recreate original view members policy for trip_members
DROP POLICY IF EXISTS "View members of own trip" ON trip_members;
CREATE POLICY "View members of own trip" ON trip_members FOR SELECT
  USING (is_trip_member(trip_id));

-- Revert is_trip_member helper function to original definition
CREATE OR REPLACE FUNCTION is_trip_member(trip uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = trip AND user_id = auth.uid()
  );
$$;

DROP FUNCTION IF EXISTS has_trip_role(uuid, text[]);
