-- Rollback: Disable RLS for trips
-- WARNING: This will remove all security policies

DROP POLICY IF EXISTS "Creator can delete trip" ON trips;
DROP POLICY IF EXISTS "Creator can update trip" ON trips;
DROP POLICY IF EXISTS "Authenticated users can create trips" ON trips;
DROP POLICY IF EXISTS "Creator can view own trip" ON trips;
DROP POLICY IF EXISTS "Member can view trip" ON trips;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
