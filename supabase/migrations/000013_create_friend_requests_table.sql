-- Migration: Create friend_requests table
-- Description: Friend system for connecting users
-- Dependencies: 000001_create_profiles_table

-- Friend requests (pending → accepted/rejected)
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created_at ON friend_requests(created_at);

-- Comments
COMMENT ON TABLE friend_requests IS 'Friend connection requests between users';
COMMENT ON COLUMN friend_requests.status IS 'Request status: pending, accepted, or rejected';
COMMENT ON COLUMN friend_requests.sender_id IS 'User who initiated the friend request';
COMMENT ON COLUMN friend_requests.receiver_id IS 'User who received the friend request';
