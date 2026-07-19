-- Rollback: Disable RLS for trip_members
-- WARNING: This will remove all security policies

DROP POLICY IF EXISTS "Join trip" ON trip_members;
DROP POLICY IF EXISTS "View members of own trip" ON trip_members;
ALTER TABLE trip_members DISABLE ROW LEVEL SECURITY;
