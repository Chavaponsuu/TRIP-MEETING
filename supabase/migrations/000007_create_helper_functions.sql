-- Migration: Create helper functions
-- Description: Utility functions for RLS and business logic
-- Dependencies: 000004_create_trip_members_table

-- Helper to avoid RLS recursion on trip_members
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_trip_member(uuid) TO authenticated;

-- Public invite lookup (returns limited fields only)
CREATE OR REPLACE FUNCTION get_trip_by_invite(invite text)
RETURNS TABLE (id uuid, name text, destination text, emoji text, month int, year int)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, name, destination, emoji, month, year
  FROM trips
  WHERE invite_code = invite;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_trip_by_invite(text) TO anon, authenticated;

-- Comments
COMMENT ON FUNCTION is_trip_member(uuid) IS 'Returns true if the current user is a member of the specified trip';
COMMENT ON FUNCTION get_trip_by_invite(text) IS 'Returns limited trip info by invite code (public access for anonymous users)';
