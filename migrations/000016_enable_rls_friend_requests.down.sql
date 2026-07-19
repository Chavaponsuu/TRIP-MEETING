-- Rollback: Disable RLS for friend_requests
-- WARNING: This will remove all security policies

DROP POLICY IF EXISTS "Sender can cancel pending" ON friend_requests;
DROP POLICY IF EXISTS "Receiver can respond" ON friend_requests;
DROP POLICY IF EXISTS "Send friend request" ON friend_requests;
DROP POLICY IF EXISTS "View own friend requests" ON friend_requests;
ALTER TABLE friend_requests DISABLE ROW LEVEL SECURITY;
