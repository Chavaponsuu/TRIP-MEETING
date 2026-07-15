-- Migration: Enable RLS for availabilities
-- Description: Row Level Security policies for availabilities table
-- Dependencies: 000005_create_availabilities_table, 000007_create_helper_functions

-- Enable RLS
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

-- Policy: Trip members can read all availabilities
CREATE POLICY "Members read availability" ON availabilities FOR SELECT
  USING (is_trip_member(trip_id));

-- Policy: Users can manage their own availability
CREATE POLICY "Write own availability" ON availabilities FOR ALL
  USING (user_id = auth.uid());

-- Comments
COMMENT ON POLICY "Members read availability" ON availabilities IS 'Trip members can view all availability data';
COMMENT ON POLICY "Write own availability" ON availabilities IS 'Users can create, update, and delete their own availability';
