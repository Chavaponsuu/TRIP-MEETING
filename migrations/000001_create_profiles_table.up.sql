-- Migration: Create profiles table
-- Description: Extends auth.users with additional profile information
-- Dependencies: auth.users (Supabase managed)

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text NOT NULL,
  avatar_color text DEFAULT '#5B6FF5',
  created_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- Comment on table
COMMENT ON TABLE profiles IS 'User profile information extending auth.users';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN profiles.name IS 'User display name';
COMMENT ON COLUMN profiles.avatar_color IS 'Hex color code for avatar';
