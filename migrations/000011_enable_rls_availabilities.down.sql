-- Rollback: Disable RLS for availabilities
-- WARNING: This will remove all security policies

DROP POLICY IF EXISTS "Write own availability" ON availabilities;
DROP POLICY IF EXISTS "Members read availability" ON availabilities;
ALTER TABLE availabilities DISABLE ROW LEVEL SECURITY;
