-- Rollback: Disable RLS for profiles
-- WARNING: This will remove all security policies

DROP POLICY IF EXISTS "View profiles of trip members" ON profiles;
DROP POLICY IF EXISTS "Own profile" ON profiles;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
