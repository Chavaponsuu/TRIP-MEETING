-- Migration: Enable RLS for friend_requests
-- Description: Row Level Security policies for friend requests
-- Dependencies: 000013_create_friend_requests_table

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Policy: View your own friend requests (sent or received)
CREATE POLICY "View own friend requests" ON friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Policy: Send friend request
CREATE POLICY "Send friend request" ON friend_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Policy: Receiver can respond to requests
CREATE POLICY "Receiver can respond" ON friend_requests FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Policy: Sender can cancel pending requests
CREATE POLICY "Sender can cancel pending" ON friend_requests FOR DELETE
  USING (sender_id = auth.uid() AND status = 'pending');

-- Comments
COMMENT ON POLICY "View own friend requests" ON friend_requests IS 'Users can view friend requests they sent or received';
COMMENT ON POLICY "Send friend request" ON friend_requests IS 'Users can send friend requests';
COMMENT ON POLICY "Receiver can respond" ON friend_requests IS 'Recipients can accept or reject friend requests';
COMMENT ON POLICY "Sender can cancel pending" ON friend_requests IS 'Senders can cancel pending requests';
