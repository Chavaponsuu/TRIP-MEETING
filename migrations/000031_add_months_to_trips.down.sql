-- Rollback: Remove months column from trips table
ALTER TABLE trips
  DROP COLUMN IF EXISTS months;
