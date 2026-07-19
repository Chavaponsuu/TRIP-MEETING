-- Rollback: Disable RLS for comments
-- WARNING: This will remove all security policies

DROP POLICY IF EXISTS "Write own comments" ON comments;
DROP POLICY IF EXISTS "Members read comments" ON comments;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
