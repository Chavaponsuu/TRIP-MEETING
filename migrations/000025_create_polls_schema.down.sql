-- Migration: Rollback polls, options, and votes tables
-- Description: Drop triggers, functions, and tables in reverse order

DROP TRIGGER IF EXISTS trigger_validate_poll_vote ON poll_votes;
DROP FUNCTION IF EXISTS validate_poll_vote();
DROP TRIGGER IF EXISTS trigger_poll_vote_count ON poll_votes;
DROP FUNCTION IF EXISTS update_poll_option_vote_count();

DROP TABLE IF EXISTS poll_votes;
DROP TABLE IF EXISTS poll_options;
DROP TABLE IF EXISTS polls;
