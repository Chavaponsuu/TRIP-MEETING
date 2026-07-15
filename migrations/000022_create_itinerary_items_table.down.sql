-- Rollback: Drop itinerary_items table
-- WARNING: This will permanently delete all itinerary items and associated data

-- Drop indexes
DROP INDEX IF EXISTS idx_itinerary_items_created_by;
DROP INDEX IF EXISTS idx_itinerary_items_status;
DROP INDEX IF EXISTS idx_itinerary_items_ordering;
DROP INDEX IF EXISTS idx_itinerary_items_day_number;
DROP INDEX IF EXISTS idx_itinerary_items_trip_id;

-- Drop table
DROP TABLE IF EXISTS itinerary_items;
