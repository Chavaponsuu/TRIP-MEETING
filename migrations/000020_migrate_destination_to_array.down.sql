-- Migration rollback: Revert destination from text[] back to text
-- Description: Rollback multi-destination support to single destination
-- WARNING: This will convert arrays to single values using the first element

-- Step 1: Add old destination column back as text (nullable initially)
ALTER TABLE trips ADD COLUMN destination_old text;

-- Step 2: Backfill with first element from array
-- If array has multiple elements, only the first one is preserved
UPDATE trips SET destination_old = destination[1] WHERE destination IS NOT NULL;

-- Step 3: Verify backfill
DO $$
DECLARE
  missing_count INTEGER;
  multi_dest_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM trips
  WHERE destination IS NOT NULL AND destination_old IS NULL;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Rollback backfill failed: % rows missing destination_old', missing_count;
  END IF;
  
  -- Warn about data loss if any trips had multiple destinations
  SELECT COUNT(*) INTO multi_dest_count
  FROM trips
  WHERE array_length(destination, 1) > 1;
  
  IF multi_dest_count > 0 THEN
    RAISE WARNING 'Rollback will lose data: % trips have multiple destinations - only first will be kept', multi_dest_count;
  END IF;
  
  RAISE NOTICE 'Rollback backfill verification passed';
END $$;

-- Step 4: Drop array column
ALTER TABLE trips DROP COLUMN destination;

-- Step 5: Rename destination_old back to destination
ALTER TABLE trips RENAME COLUMN destination_old TO destination;

-- Step 6: Add NOT NULL constraint
ALTER TABLE trips ALTER COLUMN destination SET NOT NULL;

-- Restore original comment
COMMENT ON COLUMN trips.destination IS 'Primary destination for the trip';
