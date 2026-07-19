-- Rollback: Drop trip_invitations table
-- WARNING: This will permanently delete all trip invitation data

DROP TABLE IF EXISTS trip_invitations CASCADE;
