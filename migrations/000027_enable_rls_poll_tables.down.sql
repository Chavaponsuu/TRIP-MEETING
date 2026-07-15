-- Migration: Rollback RLS policies for polls, options, and votes
-- Description: Drops policies and disables RLS on polls tables

DROP POLICY IF EXISTS "Users can update/delete own votes" ON poll_votes;
DROP POLICY IF EXISTS "Members can cast votes" ON poll_votes;
DROP POLICY IF EXISTS "Members can view votes" ON poll_votes;
DROP POLICY IF EXISTS "Poll creator can manage options" ON poll_options;
DROP POLICY IF EXISTS "Members can view poll options" ON poll_options;
DROP POLICY IF EXISTS "Creator can delete own polls" ON polls;
DROP POLICY IF EXISTS "Creator can update own polls" ON polls;
DROP POLICY IF EXISTS "Owners/co-organizers can create polls" ON polls;
DROP POLICY IF EXISTS "Members can view polls" ON polls;

ALTER TABLE poll_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE polls DISABLE ROW LEVEL SECURITY;
