-- Rollback: Drop comments table
-- WARNING: This will permanently delete all comment data

DROP TABLE IF EXISTS comments CASCADE;
