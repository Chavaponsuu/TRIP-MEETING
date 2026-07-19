-- Migration: Enable RLS for trip_invitations
-- Description: Row Level Security policies for trip invitations
-- Dependencies: 000014_create_trip_invitations_table, 000015_create_friend_helper_functions

-- Enable RLS
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: View related trip invitations
CREATE POLICY "View related trip invitations" ON trip_invitations FOR SELECT
  USING (
    inviter_id = auth.uid()
    OR invitee_id = auth.uid()
    OR is_trip_member(trip_id)
  );

-- Policy: Members can invite friends to trips
CREATE POLICY "Members can invite friends" ON trip_invitations FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND is_trip_member(trip_id)
    AND are_friends(auth.uid(), invitee_id)
    AND NOT EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_id = trip_invitations.trip_id
        AND user_id = trip_invitations.invitee_id
    )
  );

-- Policy: Invitee can respond to invitations
CREATE POLICY "Invitee can respond" ON trip_invitations FOR UPDATE
  USING (invitee_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid());

-- Comments
COMMENT ON POLICY "View related trip invitations" ON trip_invitations IS 'Users can view invitations they sent, received, or are members of the trip';
COMMENT ON POLICY "Members can invite friends" ON trip_invitations IS 'Trip members can invite their friends who are not already members';
COMMENT ON POLICY "Invitee can respond" ON trip_invitations IS 'Invitees can accept or decline invitations';
