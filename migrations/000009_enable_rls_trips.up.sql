-- Migration: Enable RLS for trips
-- Description: Row Level Security policies for trips table
-- Dependencies: 000003_create_trips_table, 000007_create_helper_functions

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view trips they've joined
CREATE POLICY "Member can view trip" ON trips FOR SELECT
  USING (is_trip_member(id));

-- Policy: Creators can view their own trips
CREATE POLICY "Creator can view own trip" ON trips FOR SELECT
  USING (created_by = auth.uid());

-- Policy: Authenticated users can create trips
CREATE POLICY "Authenticated users can create trips" ON trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy: Creators can update their trips
CREATE POLICY "Creator can update trip" ON trips FOR UPDATE
  USING (created_by = auth.uid());

-- Policy: Creators can delete their trips
CREATE POLICY "Creator can delete trip" ON trips FOR DELETE
  USING (created_by = auth.uid());

-- Comments
COMMENT ON POLICY "Member can view trip" ON trips IS 'Trip members can view trip details';
COMMENT ON POLICY "Creator can view own trip" ON trips IS 'Trip creators can view their own trips';
COMMENT ON POLICY "Authenticated users can create trips" ON trips IS 'Any authenticated user can create a new trip';
COMMENT ON POLICY "Creator can update trip" ON trips IS 'Only trip creator can update trip details';
COMMENT ON POLICY "Creator can delete trip" ON trips IS 'Only trip creator can delete the trip';
