-- Migration: Create comments table
-- Description: Trip discussion comments
-- Dependencies: 000001_create_profiles_table, 000003_create_trips_table

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_trip_id ON comments(trip_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_trip_created ON comments(trip_id, created_at DESC);

-- Comments
COMMENT ON TABLE comments IS 'Discussion comments for trips';
COMMENT ON COLUMN comments.trip_id IS 'References trips.id, cascades on delete';
COMMENT ON COLUMN comments.user_id IS 'References profiles.id, cascades on delete';
