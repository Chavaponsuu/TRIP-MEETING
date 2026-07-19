-- Migration: Enable RLS for trip_members
-- Description: Row Level Security policies for trip_members table
-- Dependencies: 000004_create_trip_members_table, 000007_create_helper_functions

-- Enable RLS
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- Policy: View members of trips you're in
CREATE POLICY "View members of own trip" ON trip_members FOR SELECT
  USING (is_trip_member(trip_id));

-- Policy: Users can join trips
CREATE POLICY "Join trip" ON trip_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT ON POLICY "View members of own trip" ON trip_members IS 'Users can view members of trips they have joined';
COMMENT ON POLICY "Join trip" ON trip_members IS 'Users can add themselves to trips';
