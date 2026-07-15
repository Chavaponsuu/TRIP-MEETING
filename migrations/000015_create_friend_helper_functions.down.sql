-- Rollback: Drop friend helper functions

DROP FUNCTION IF EXISTS search_profiles(text);
DROP FUNCTION IF EXISTS are_friends(uuid, uuid);
