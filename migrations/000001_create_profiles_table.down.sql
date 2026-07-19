-- Rollback: Drop profiles table
-- WARNING: This will permanently delete all user profile data

DROP TABLE IF EXISTS profiles CASCADE;
