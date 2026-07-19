-- Rollback: Drop trip_members table
-- WARNING: This will permanently delete all trip membership data

DROP TABLE IF EXISTS trip_members CASCADE;
