-- Rollback: Remove itinerary_comments table
-- WARNING: This will permanently delete all itinerary comments data

-- Drop indexes
DROP INDEX IF EXISTS idx_itinerary_comments_created_at;
DROP INDEX IF EXISTS idx_itinerary_comments_user_id;
DROP INDEX IF EXISTS idx_itinerary_comments_item_id;

-- Drop table
DROP TABLE IF EXISTS itinerary_comments;
