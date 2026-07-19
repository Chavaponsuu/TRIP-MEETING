-- Migration: Create trip_members table
-- Description: Junction table for trip participants
-- Dependencies: 000001_create_profiles_table, 000003_create_trips_table

-- Trip members
CREATE TABLE IF NOT EXISTS trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_joined_at ON trip_members(joined_at);

-- Comments
COMMENT ON TABLE trip_members IS 'Junction table linking users to trips they have joined';
COMMENT ON COLUMN trip_members.trip_id IS 'References trips.id, cascades on delete';
COMMENT ON COLUMN trip_members.user_id IS 'References profiles.id, cascades on delete';
