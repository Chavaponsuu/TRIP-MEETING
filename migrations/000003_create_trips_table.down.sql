-- Rollback: Drop trips table
-- WARNING: This will permanently delete all trip data

DROP TABLE IF EXISTS trips CASCADE;
