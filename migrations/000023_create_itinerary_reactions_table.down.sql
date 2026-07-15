-- Rollback: Drop itinerary_reactions table
-- WARNING: This will permanently delete all itinerary reactions data

-- Drop indexes
DROP INDEX IF EXISTS idx_itinerary_reactions_user_id;
DROP INDEX IF EXISTS idx_itinerary_reactions_item_id;

-- Drop table
DROP TABLE IF EXISTS itinerary_reactions;
