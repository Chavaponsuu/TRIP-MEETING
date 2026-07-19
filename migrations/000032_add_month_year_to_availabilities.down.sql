-- Rollback: Remove month and year columns from availabilities table
ALTER TABLE availabilities
  DROP CONSTRAINT IF EXISTS availabilities_trip_id_user_id_day_month_year_key;

-- Re-add old unique constraint
ALTER TABLE availabilities
  ADD CONSTRAINT availabilities_trip_id_user_id_day_key UNIQUE (trip_id, user_id, day);

ALTER TABLE availabilities
  DROP COLUMN IF EXISTS month,
  DROP COLUMN IF EXISTS year;
