-- Migration: Enable RLS for comments
-- Description: Row Level Security policies for comments table
-- Dependencies: 000006_create_comments_table, 000007_create_helper_functions

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy: Trip members can read comments
CREATE POLICY "Members read comments" ON comments FOR SELECT
  USING (is_trip_member(trip_id));

-- Policy: Users can post their own comments
CREATE POLICY "Write own comments" ON comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT ON POLICY "Members read comments" ON comments IS 'Trip members can read all comments in the trip';
COMMENT ON POLICY "Write own comments" ON comments IS 'Users can post comments to trips they are members of';
