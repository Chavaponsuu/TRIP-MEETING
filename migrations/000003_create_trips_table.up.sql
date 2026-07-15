-- Migration: Create trips table
-- Description: Core trips table for managing group trip planning
-- Dependencies: 000001_create_profiles_table

-- Trips
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text NOT NULL,
  emoji text DEFAULT '🗺️',
  description text,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year int NOT NULL,
  created_by uuid REFERENCES profiles(id),
  invite_code text UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_created_by ON trips(created_by);
CREATE INDEX IF NOT EXISTS idx_trips_invite_code ON trips(invite_code);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
CREATE INDEX IF NOT EXISTS idx_trips_month_year ON trips(month, year);

-- Comments
COMMENT ON TABLE trips IS 'Trip planning sessions';
COMMENT ON COLUMN trips.month IS 'Primary month for the trip (1-12)';
COMMENT ON COLUMN trips.year IS 'Year of the trip';
COMMENT ON COLUMN trips.invite_code IS 'Unique 8-character invite code for sharing';
