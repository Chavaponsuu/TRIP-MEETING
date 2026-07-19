-- Migration: Create itinerary_comments table
-- Description: Enable discussion comments on specific itinerary items
-- Dependencies: 000021_create_itinerary_items_table, 000001_create_profiles_table
-- Requirements: 18.2

-- Create itinerary_comments table
CREATE TABLE itinerary_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_item_id uuid REFERENCES itinerary_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_itinerary_comments_item_id ON itinerary_comments(itinerary_item_id);
CREATE INDEX idx_itinerary_comments_user_id ON itinerary_comments(user_id);
CREATE INDEX idx_itinerary_comments_created_at ON itinerary_comments(created_at);

-- Add comments for documentation
COMMENT ON TABLE itinerary_comments IS 'Discussion comments on specific itinerary items (separate from trip-level comments)';
COMMENT ON COLUMN itinerary_comments.itinerary_item_id IS 'Reference to the itinerary item being commented on';
COMMENT ON COLUMN itinerary_comments.text IS 'Comment text content';
COMMENT ON COLUMN itinerary_comments.created_at IS 'Timestamp when comment was posted';
