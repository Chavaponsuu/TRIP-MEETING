-- Migration: Create friend system helper functions
-- Description: Utility functions for friend relationships
-- Dependencies: 000013_create_friend_requests_table

-- Helper: check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friend_requests
    WHERE status = 'accepted'
      AND (
        (sender_id = user_a AND receiver_id = user_b)
        OR (sender_id = user_b AND receiver_id = user_a)
      )
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION are_friends(uuid, uuid) TO authenticated;

-- Search profiles by name (returns limited public fields)
CREATE OR REPLACE FUNCTION search_profiles(search_query text)
RETURNS TABLE (id uuid, name text, avatar_color text, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.id, p.name, p.avatar_color, p.created_at
  FROM profiles p
  WHERE p.id != auth.uid()
    AND length(trim(search_query)) >= 2
    AND p.name ILIKE '%' || trim(search_query) || '%'
  ORDER BY p.name
  LIMIT 20;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_profiles(text) TO authenticated;

-- Comments
COMMENT ON FUNCTION are_friends(uuid, uuid) IS 'Returns true if two users have an accepted friend connection';
COMMENT ON FUNCTION search_profiles(text) IS 'Search for users by name, returns up to 20 matches';
