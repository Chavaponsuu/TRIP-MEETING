-- Rollback: Drop helper functions

DROP FUNCTION IF EXISTS get_trip_by_invite(text);
DROP FUNCTION IF EXISTS is_trip_member(uuid);
