-- Drop any existing policies that might conflict
-- Run this BEFORE running fix-invitations-complete.sql if you get errors

drop policy if exists "View profiles in friend requests" on profiles;
drop policy if exists "View profiles in friend requests and invitations" on profiles;
drop policy if exists "Invitees can view trip details" on trips;
