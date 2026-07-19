-- Migration: Create availabilities table
-- Description: Stores which days each user is available for trips
-- Dependencies: 000001_create_profiles_table, 000003_create_trips_table

-- Availability (days each user is free)
CREATE TABLE IF NOT EXISTS availabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  day int NOT NULL CHECK (day BETWEEN 1 AND 31),
  UNIQUE(trip_id, user_id, day)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_availabilities_trip_id ON availabilities(trip_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_user_id ON availabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_trip_day ON availabilities(trip_id, day);

-- Comments
COMMENT ON TABLE availabilities IS 'User availability for specific days in a trip';
COMMENT ON COLUMN availabilities.day IS 'Day of month (1-31) when user is available';
COMMENT ON COLUMN availabilities.trip_id IS 'References trips.id, cascades on delete';
COMMENT ON COLUMN availabilities.user_id IS 'References profiles.id, cascades on delete';
