-- Rollback: Drop friend_requests table
-- WARNING: This will permanently delete all friend request data

DROP TABLE IF EXISTS friend_requests CASCADE;
