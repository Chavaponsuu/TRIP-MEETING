-- Migration: Migrate destination from text to text[]
-- Description: Convert single destination field to support multiple destinations
-- Dependencies: 000003_create_trips_table
-- Requirements: 1.8, 1.9, 1.10, 1.11

-- Step 1: Add new destination_new column as text[] (nullable initially)
ALTER TABLE trips ADD COLUMN destination_new text[];

-- Step 2: Backfill data - convert existing destination to single-element array
UPDATE trips SET destination_new = ARRAY[destination] WHERE destination IS NOT NULL;

-- Step 3: Verify backfill completed successfully
-- Count rows where destination exists but destination_new doesn't
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM trips
  WHERE destination IS NOT NULL AND destination_new IS NULL;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Backfill verification failed: % rows missing destination_new', missing_count;
  END IF;
  
  RAISE NOTICE 'Backfill verification passed: all rows successfully migrated';
END $$;

-- Step 4: Drop old destination column
ALTER TABLE trips DROP COLUMN destination;

-- Step 5: Rename destination_new to destination
ALTER TABLE trips RENAME COLUMN destination_new TO destination;

-- Step 6: Add NOT NULL constraint
ALTER TABLE trips ALTER COLUMN destination SET NOT NULL;

-- Step 7: Add CHECK constraint to ensure at least one destination
ALTER TABLE trips ADD CONSTRAINT destination_not_empty CHECK (array_length(destination, 1) >= 1);

-- Add comment for documentation
COMMENT ON COLUMN trips.destination IS 'Array of destination names (at least 1 required)';
