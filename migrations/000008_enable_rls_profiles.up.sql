-- Migration: Enable RLS for profiles
-- Description: Row Level Security policies for profiles table
-- Dependencies: 000001_create_profiles_table, 000004_create_trip_members_table

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own profile
CREATE POLICY "Own profile" ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: View profiles of other members in same trips
CREATE POLICY "View profiles of trip members" ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trip_members tm1
    JOIN trip_members tm2 ON tm1.trip_id = tm2.trip_id
    WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
  ));

-- Comments
COMMENT ON POLICY "Own profile" ON profiles IS 'Users can read and update their own profile';
COMMENT ON POLICY "View profiles of trip members" ON profiles IS 'Users can view profiles of other members in the same trips';
