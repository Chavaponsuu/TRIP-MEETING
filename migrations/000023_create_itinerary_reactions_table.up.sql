-- Migration: Create itinerary_reactions table
-- Description: Enable quick emoji reactions to itinerary items
-- Dependencies: 000021_create_itinerary_items_table, 000001_create_profiles_table
-- Requirements: 18.1

-- Create itinerary_reactions table
CREATE TABLE itinerary_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_item_id uuid REFERENCES itinerary_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('thumbs_up', 'heart', 'fire', 'thinking', 'thumbs_down')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(itinerary_item_id, user_id, reaction_type)
);

-- Add indexes for performance
CREATE INDEX idx_itinerary_reactions_item_id ON itinerary_reactions(itinerary_item_id);
CREATE INDEX idx_itinerary_reactions_user_id ON itinerary_reactions(user_id);

-- Add comments for documentation
COMMENT ON TABLE itinerary_reactions IS 'Quick emoji reactions to itinerary items - each user can react once per reaction type per item';
COMMENT ON COLUMN itinerary_reactions.reaction_type IS 'Type of reaction: thumbs_up, heart, fire, thinking, or thumbs_down';
COMMENT ON COLUMN itinerary_reactions.itinerary_item_id IS 'Reference to the itinerary item being reacted to';
