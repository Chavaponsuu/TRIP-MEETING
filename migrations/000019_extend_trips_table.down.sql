-- Migration: Rollback trips table extensions
-- Description: Remove status, date_mode, start_date, end_date, budget, currency, cover_image_url columns

-- Drop indexes
DROP INDEX IF EXISTS idx_trips_status;
DROP INDEX IF EXISTS idx_trips_start_date;

-- Drop constraint
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_end_after_start;

-- Drop columns
ALTER TABLE trips
  DROP COLUMN IF EXISTS cover_image_url,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS budget,
  DROP COLUMN IF EXISTS end_date,
  DROP COLUMN IF EXISTS start_date,
  DROP COLUMN IF EXISTS date_mode,
  DROP COLUMN IF EXISTS status;
