-- Migration: Add month and year columns to availabilities table
-- Description: Supports multiple months availability checking in trip planning
-- Requirements: 1.11

ALTER TABLE availabilities
  ADD COLUMN IF NOT EXISTS month int,
  ADD COLUMN IF NOT EXISTS year int;

-- Update unique constraint to include month and year to prevent duplicate availability records
ALTER TABLE availabilities
  DROP CONSTRAINT IF EXISTS availabilities_trip_id_user_id_day_key,
  ADD CONSTRAINT availabilities_trip_id_user_id_day_month_year_key UNIQUE (trip_id, user_id, day, month, year);

COMMENT ON COLUMN availabilities.month IS 'Month of availability (1-12)';
COMMENT ON COLUMN availabilities.year IS 'Year of availability';
